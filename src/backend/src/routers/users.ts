import { z } from 'zod'
import { createTRPCRouter, procedure } from '../server/trpc'
import { users, insertUserSchema, selectUserSchema } from '../db/schema'
import { eq } from 'drizzle-orm'

export const usersRouter = createTRPCRouter({
  getAll: procedure
    .meta({ openapi: { method: 'GET', path: '/users' } })
    .input(z.object({}))
    .output(z.array(insertUserSchema))
    .query(async ({ ctx }) => {
      return ctx.db.select().from(users)
    }),
    

  getById: procedure
    .meta({ openapi: { method: 'GET', path: '/users/{id}' } })
    .input(z.object({ id: z.number() }))
    .output(selectUserSchema)
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
      return result[0]
    }),

  create: procedure
    .meta({ openapi: { method: 'POST', path: '/users' } })
    .input(insertUserSchema)
    .output(selectUserSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(users).values(input).returning()
      return result[0]
    }),
})
