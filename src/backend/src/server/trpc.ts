/**
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { OpenApiMeta } from 'trpc-openapi'
import { db } from '../db'
import { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { TRPCError } from '@trpc/server'
import { apiKeys, apiRequestLogs } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export const createTRPCContext = async ({
  req,
}: CreateExpressContextOptions) => {
  return {
    db,
    headers: req.headers,
    req,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
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
      }
    },
  })

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
export const createTRPCRouter = t.router

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const procedure = t.procedure

// Create a middleware that checks for a valid API key or session and logs the request
const authMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const startTime = Date.now()
  const apiKey = ctx.headers['x-api-key']
  let apiKeyRecord = null
  let error = null
  let statusCode = 200
  let userId: string | null = null

  try {
    // First check for session auth
    const session = ctx.req.headers['x-trpc-session']
    if (session && typeof session === 'string') {
      const sessionData = JSON.parse(session)
      if (sessionData?.user?.id) {
        userId = sessionData.user.id
      }
    }

    // If no session, check for API key
    if (!userId && apiKey && typeof apiKey === 'string') {
      const apiKeyResult = await ctx.db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.key, apiKey), eq(apiKeys.isRevoked, false)))

      if (!apiKeyResult[0]) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        })
      }

      apiKeyRecord = apiKeyResult[0]
      userId = apiKeyRecord.userId

      // Update last used timestamp for API key
      await ctx.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, apiKeyRecord.id))
    }

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      })
    }

    // Call the next middleware/procedure with auth context
    return next({
      ctx: {
        ...ctx,
        auth: { userId },
      },
    })
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error'
    statusCode = e instanceof TRPCError ? parseInt(e.code) : 500
    throw e
  } finally {
    // Log API key requests
    if (apiKeyRecord) {
      const duration = Date.now() - startTime
      await ctx.db.insert(apiRequestLogs).values({
        apiKeyId: apiKeyRecord.id,
        userId: apiKeyRecord.userId,
        method: type,
        path,
        statusCode,
        requestBody: null,
        responseBody: null,
        error,
        duration,
      })
    }
  }
})

export const protectedProcedure = t.procedure.use(authMiddleware)
