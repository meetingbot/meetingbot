import { z } from 'zod'
import { createTRPCRouter, procedure } from '../server/trpc'
import { bots, insertBotSchema, selectBotSchema } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

export const botsRouter = createTRPCRouter({
  getBots: procedure
    .meta({ openapi: { method: 'GET', path: '/bots' } })
    .input(z.object({}))
    .output(z.array(selectBotSchema))
    .query(async ({ ctx }) => {
      return await ctx.db.select().from(bots)
    }),

  getBot: procedure
    .meta({ openapi: { method: 'GET', path: '/bots/{id}' } })
    .input(z.object({ id: z.number() }))
    .output(selectBotSchema)
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select()
        .from(bots)
        .where(eq(bots.id, input.id))
      if (!result[0]) {
        throw new Error('Bot not found')
      }
      return result[0]
    }),

  createBot: procedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/bots',
        description: 'Create a new bot',
      },
    })
    .input(insertBotSchema)
    .output(selectBotSchema)
    .mutation(async ({ input, ctx }) => {
      console.log('Starting bot creation...')
      try {
        // Test database connection
        await ctx.db.execute(sql`SELECT 1`)
        console.log('Database connection successful')

        console.log('Inserting bot with input:', input)
        const result = await ctx.db.insert(bots).values(input).returning()
        console.log('Insert successful, result:', result)

        if (!result[0]) {
          throw new Error('Bot creation failed - no result returned')
        }

        return result[0]
      } catch (error) {
        console.error('Error creating bot:', error)
        throw error
      }
    }),

  updateBot: procedure
    .meta({ openapi: { method: 'PATCH', path: '/bots/{id}' } })
    .input(
      z.object({
        id: z.number(),
        data: insertBotSchema.partial(),
      })
    )
    .output(selectBotSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db
        .update(bots)
        .set(input.data)
        .where(eq(bots.id, input.id))
        .returning()

      if (!result[0]) {
        throw new Error('Bot not found')
      }
      return result[0]
    }),

  deleteBot: procedure
    .meta({ openapi: { method: 'DELETE', path: '/bots/{id}' } })
    .input(z.object({ id: z.number() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db
        .delete(bots)
        .where(eq(bots.id, input.id))
        .returning()

      if (!result[0]) {
        throw new Error('Bot not found')
      }
      return { message: 'Bot deleted successfully' }
    }),

  getRecording: procedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/bots/{id}/recording',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ recording: z.string().nullable() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select({ recording: bots.recording })
        .from(bots)
        .where(eq(bots.id, input.id))

      if (!result[0]) {
        throw new Error('Bot not found')
      }
      return { recording: result[0].recording }
    }),
})
