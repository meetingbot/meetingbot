import { z } from 'zod'
import { createTRPCRouter, procedure } from '../server/trpc'
import {
  bots,
  events,
  insertBotSchema,
  selectBotSchema,
  deployBotInputSchema,
  insertEventSchema,
  status,
} from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { deployBot, shouldDeployImmediately } from '../services/botDeployment'

export const botsRouter = createTRPCRouter({
  getBots: procedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/bots',
        description: 'Retrieve a list of all bots',
      },
    })
    .input(z.object({}))
    .output(z.array(selectBotSchema))
    .query(async ({ ctx }) => {
      return await ctx.db.select().from(bots)
    }),

  getBot: procedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/bots/{id}',
        description: 'Get a specific bot by its ID',
      },
    })
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
        description: 'Create a new bot with the specified configuration',
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

        // Extract database fields from input
        const dbInput = {
          userId: input.userId,
          meetingTitle: input.meetingTitle,
          meetingInfo: input.meetingInfo,
          startTime: input.startTime,
          endTime: input.endTime,
          status: status.enum.READY_TO_DEPLOY,
        }

        const result = await ctx.db.insert(bots).values(dbInput).returning()

        if (!result[0]) {
          throw new Error('Bot creation failed - no result returned')
        }

        // Check if we should deploy immediately
        if (await shouldDeployImmediately(input.startTime)) {
          console.log('Deploying bot immediately...')
          return await deployBot({
            botId: result[0].id,
            botConfig: input,
            db: ctx.db,
          })
        }

        return result[0]
      } catch (error) {
        console.error('Error creating bot:', error)
        throw error
      }
    }),

  updateBot: procedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/bots/{id}',
        description: "Update an existing bot's configuration",
      },
    })
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
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/bots/{id}',
        description: 'Delete a bot by its ID',
      },
    })
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
        description: 'Retrieve the recording associated with a specific bot',
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

  heartbeat: procedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/bots/{id}/heartbeat',
        description:
          'Called every few seconds by bot scripts to indicate that the bot is still running',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Update bot's last heartbeat
      const botUpdate = await ctx.db
        .update(bots)
        .set({ lastHeartbeat: new Date() })
        .where(eq(bots.id, input.id))
        .returning()

      if (!botUpdate[0]) {
        throw new Error('Bot not found')
      }

      return { success: true }
    }),

  reportEvent: procedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/bots/{id}/events',
        description:
          'Called whenever an event occurs during the bot session to record it immediately',
      },
    })
    .input(
      z.object({
        id: z.number(),
        event: insertEventSchema.omit({ botId: true }),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Insert the event
      await ctx.db.insert(events).values({
        ...input.event,
        botId: input.id,
      })

      return { success: true }
    }),

  deployBot: procedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/bots/{id}/deploy',
        description:
          'Deploy a bot by provisioning necessary resources and starting it up',
      },
    })
    .input(deployBotInputSchema)
    .output(selectBotSchema)
    .mutation(async ({ input, ctx }) => {
      return await deployBot({
        botId: input.id,
        botConfig: input.botConfig,
        db: ctx.db,
      })
    }),
})
