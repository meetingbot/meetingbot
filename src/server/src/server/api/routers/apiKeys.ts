import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  apiKeys,
  insertApiKeySchema,
  selectApiKeySchema,
  apiRequestLogs,
  selectApiRequestLogSchema,
} from "../../db/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { extractCount } from "~/server/utils/database";

export const apiKeysRouter = createTRPCRouter({
  createApiKey: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/api-keys",
        description: "Create a new API key for the specified user",
      },
    })
    .input(
      insertApiKeySchema.extend({
        expiresAt: z
          .date()
          .optional()
          .default(new Date(Date.now() + 1000 * 60 * 60 * 24 * 180)), // 6 months from now
      }),
    )
    .output(
      selectApiKeySchema.extend({
        key: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Generate a random API key
      const key = randomBytes(32).toString("hex");

      const result = await ctx.db
        .insert(apiKeys)
        .values({
          userId: ctx.session.user.id,
          expiresAt: input.expiresAt,
          key,
          name: input.name,
        })
        .returning();

      if (!result[0]) {
        throw new Error("Failed to create API key");
      }

      return result[0];
    }),

  listApiKeys: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api-keys",
        description: "List all API keys for the specified user",
      },
    })
    .input(z.object({}))
    .output(z.array(selectApiKeySchema))
    .query(async ({ ctx }) => {
      return await ctx.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, ctx.session.user.id));
    }),

  revokeApiKey: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/api-keys/{id}/revoke",
        description: "Revoke an API key",
      },
    })
    .input(z.object({ id: z.number() }))
    .output(selectApiKeySchema)
    .mutation(async ({ input, ctx }) => {
      // Check if the API key belongs to the user
      const apiKey = await ctx.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.userId, ctx.session.user.id),
          ),
        );

      if (!apiKey[0] || apiKey[0].userId !== ctx.session.user.id) {
        throw new Error("API key not found");
      }

      const result = await ctx.db
        .update(apiKeys)
        .set({ isRevoked: true })
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!result[0]) {
        throw new Error("API key not found");
      }

      return result[0];
    }),

  getApiKeyLogs: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api-keys/{id}/logs",
        description: "Get usage logs for a specific API key",
      },
    })
    .input(
      z.object({
        id: z.number(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .output(
      z.object({
        logs: z.array(selectApiRequestLogSchema),
        total: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Check if the API key belongs to the user
      const apiKey = await ctx.db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.userId, ctx.session.user.id),
          ),
        );

      if (!apiKey[0] || apiKey[0].userId !== ctx.session.user.id) {
        throw new Error("API key not found");
      }

      // Get logs with pagination
      const logs = await ctx.db
        .select()
        .from(apiRequestLogs)
        .where(
          and(
            eq(apiRequestLogs.apiKeyId, input.id),
            eq(apiRequestLogs.userId, ctx.session.user.id),
          ),
        )
        .orderBy(desc(apiRequestLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(apiRequestLogs)
        .where(
          and(
            eq(apiRequestLogs.apiKeyId, input.id),
            eq(apiRequestLogs.userId, ctx.session.user.id),
          ),
        );

      return {
        logs,
        total: extractCount(countResult),
      };
    }),

  getAllApiKeyLogs: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api-keys/logs",
        description: "Get usage logs for all API keys owned by the user",
      },
    })
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .output(
      z.object({
        logs: z.array(selectApiRequestLogSchema),
        total: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Get all API key IDs for the user
      const userApiKeys = await ctx.db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, ctx.session.user.id));

      const apiKeyIds = userApiKeys.map((key) => key.id);

      if (apiKeyIds.length === 0) {
        return {
          logs: [],
          total: 0,
        };
      }

      // Get logs with pagination
      const logs = await ctx.db
        .select()
        .from(apiRequestLogs)
        .where(
          and(
            inArray(apiRequestLogs.apiKeyId, apiKeyIds),
            eq(apiRequestLogs.userId, ctx.session.user.id),
          ),
        )
        .orderBy(desc(apiRequestLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(apiRequestLogs)
        .where(
          and(
            inArray(apiRequestLogs.apiKeyId, apiKeyIds),
            eq(apiRequestLogs.userId, ctx.session.user.id),
          ),
        );

      return {
        logs,
        total: extractCount(countResult),
      };
    }),

  getApiKeyCount: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/api-keys/count",
        description:
          "Get the total count of non-expired API keys owned by the user",
      },
    })
    .input(z.object({}))
    .output(z.object({ count: z.number() }))
    .query(async ({ ctx }) => {
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.userId, ctx.session.user.id),
            sql`${apiKeys.expiresAt} > NOW()`,
          ),
        );

      return { count: extractCount(countResult) };
    }),
});
