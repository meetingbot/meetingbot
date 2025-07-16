/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

import type { OpenApiMeta } from "trpc-to-openapi";
import { eq, and, gt } from "drizzle-orm";
import { apiKeys, apiRequestLogs, users } from "../db/schema";
import type { Session } from "next-auth";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createTRPCContext>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
const getStatusCode = (e: unknown) => {
  return e instanceof TRPCError
    ? ({
        BAD_REQUEST: 400,
        PARSE_ERROR: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_SUPPORTED: 405,
        TIMEOUT: 408,
        CONFLICT: 409,
        PRECONDITION_FAILED: 412,
        PAYLOAD_TOO_LARGE: 413,
        UNPROCESSABLE_CONTENT: 422,
        TOO_MANY_REQUESTS: 429,
        CLIENT_CLOSED_REQUEST: 499,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
        UNSUPPORTED_MEDIA_TYPE: 415,
        PAYMENT_REQUIRED: 402,
      }[e.code] ?? 500)
    : 500;
};

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next, path, type }) => {
    // try to authenticate using nextauth
    if (ctx.session?.user) {
      console.log("authenticated using nextauth");
      return next({
        ctx: {
          // infers the `session` as non-nullable
          session: { ...ctx.session, user: ctx.session.user },
        },
      });
    }

    // try to authenticate using api key
    const apiKey = ctx.headers.get("x-api-key");
    if (apiKey) {
      console.log("authenticated using api key ", apiKey);
      let error = null;
      let statusCode = 200;
      const startTime = Date.now();

      const apiKeyResult = await ctx.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.key, apiKey),
            eq(apiKeys.isRevoked, false),
            gt(apiKeys.expiresAt, new Date()),
          ),
        );

      if (apiKeyResult[0]) {
        const apiKey = apiKeyResult[0];

        try {
          await ctx.db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, apiKey.id));

          const dbUser = await ctx.db
            .select()
            .from(users)
            .where(eq(users.id, apiKey.userId));

          if (!dbUser[0]) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
          }

          const session: Session = {
            user: {
              id: dbUser[0].id,
              name: dbUser[0].name,
              email: dbUser[0].email,
            },
            expires: apiKey.expiresAt
              ? apiKey.expiresAt.toISOString()
              : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          };

          return next({
            ctx: {
              ...ctx,
              session,
            },
          });
        } catch (e) {
          error = e instanceof Error ? e.message : "Unknown error";
          statusCode = getStatusCode(e);
          throw e;
        } finally {
          if (apiKey) {
            const duration = Date.now() - startTime;

            await ctx.db.insert(apiRequestLogs).values({
              apiKeyId: apiKey.id,
              userId: apiKey.userId,
              method: type,
              path,
              statusCode,
              requestBody: null,
              responseBody: null, // We don't log response bodies for privacy/security
              error,
              duration,
            });
          }
        }
      }
    }

    throw new TRPCError({ code: "UNAUTHORIZED" });
  });
