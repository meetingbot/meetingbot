import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../server/trpc'
import { users, insertUserSchema, selectUserSchema } from '../db/schema'
import { eq } from 'drizzle-orm'

export const usersRouter = createTRPCRouter({
  getUsers: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users',
        description: 'Retrieve a list of all users',
      },
    })
    .input(z.object({}))
    .output(z.array(insertUserSchema))
    .query(async ({ ctx }) => {
      return ctx.db.select().from(users)
    }),

  getUser: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users/{id}',
        description: 'Get a specific user by their ID',
      },
    })
    .input(z.object({ id: z.string() }))
    .output(selectUserSchema)
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
      if (!result[0]) {
        throw new Error(`User with ID ${input.id} not found`)
      }
      return result[0]
    }),

  createUser: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/users',
        description: 'Create a new user',
      },
    })
    .input(insertUserSchema)
    .output(selectUserSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(users).values(input).returning()
      if (!result[0]) {
        throw new Error('Failed to create user')
      }
      return result[0]
    }),

  updateUser: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/users/{id}',
        description: "Update an existing user's information",
      },
    })
    .input(
      z.object({
        id: z.string(),
        data: insertUserSchema.partial(),
      })
    )
    .output(selectUserSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(users)
        .set(input.data)
        .where(eq(users.id, input.id))
        .returning()

      if (!result[0]) {
        throw new Error('User not found')
      }
      return result[0]
    }),

  deleteUser: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/users/{id}',
        description: 'Delete a user by their ID',
      },
    })
    .input(z.object({ id: z.string() }))
    .output(selectUserSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(users)
        .where(eq(users.id, input.id))
        .returning()

      if (!result[0]) {
        throw new Error('User not found')
      }
      return result[0]
    }),
})
