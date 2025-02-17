import { z } from 'zod'
import { createTRPCRouter, procedure, protectedProcedure } from '../server/trpc'
import {
  events,
  insertEventSchema,
  selectEventSchema,
  EVENT_DESCRIPTIONS,
  bots,
} from '../db/schema'
import { eq } from 'drizzle-orm'

export const eventsRouter = createTRPCRouter({
  getAllEvents: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/events',
        description:
          'Retrieve a list of all events. Each event includes an eventType which can be one of several types, each with specific meanings:\n' +
          Object.entries(EVENT_DESCRIPTIONS)
            .map(([type, desc]) => `- ${type}: ${desc}`)
            .join('\n'),
      },
    })
    .input(z.object({}))
    .output(z.array(selectEventSchema))
    .query(async ({ ctx }) => {
      // Get all events for bots owned by the user
      const userBots = await ctx.db
        .select({ id: bots.id })
        .from(bots)
        .where(eq(bots.userId, ctx.auth.userId))

      const botIds = userBots.map((bot) => bot.id)
      if (botIds.length === 0) {
        return []
      }
      return await ctx.db
        .select()
        .from(events)
        .where(eq(events.botId, botIds[0]))
    }),

  getEventsForBot: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/events/bot/{botId}',
        description:
          'Get all events associated with a specific bot. Each event includes an eventType which can be one of several types, each with specific meanings:\n' +
          Object.entries(EVENT_DESCRIPTIONS)
            .map(([type, desc]) => `- ${type}: ${desc}`)
            .join('\n'),
      },
    })
    .input(z.object({ botId: z.number() }))
    .output(z.array(selectEventSchema))
    .query(async ({ ctx, input }) => {
      // Check if the bot belongs to the user
      const bot = await ctx.db
        .select()
        .from(bots)
        .where(eq(bots.id, input.botId))

      if (!bot[0] || bot[0].userId !== ctx.auth.userId) {
        throw new Error('Bot not found')
      }

      return await ctx.db
        .select()
        .from(events)
        .where(eq(events.botId, input.botId))
    }),

  getEvent: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/events/{id}',
        description: 'Get a specific event by its ID',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(selectEventSchema)
    .query(async ({ ctx, input }) => {
      // Get the event and join with bots to check ownership
      const result = await ctx.db
        .select({
          event: events,
          bot: bots,
        })
        .from(events)
        .leftJoin(bots, eq(events.botId, bots.id))
        .where(eq(events.id, input.id))

      if (!result[0] || !result[0].bot || result[0].bot.userId !== ctx.auth.userId) {
        throw new Error('Event not found')
      }
      return result[0].event
    }),

  createEvent: procedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/events',
        description: 'Create a new event',
      },
    })
    .input(insertEventSchema)
    .output(selectEventSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(events).values(input).returning()
      if (!result[0]) {
        throw new Error('Failed to create event')
      }
      return result[0]
    }),

  updateEvent: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/events/{id}',
        description: "Update an existing event's information",
      },
    })
    .input(
      z.object({
        id: z.number(),
        data: insertEventSchema.partial(),
      })
    )
    .output(selectEventSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if the event's bot belongs to the user
      const event = await ctx.db
        .select({
          event: events,
          bot: bots,
        })
        .from(events)
        .leftJoin(bots, eq(events.botId, bots.id))
        .where(eq(events.id, input.id))

      if (!event[0] || !event[0].bot || event[0].bot.userId !== ctx.auth.userId) {
        throw new Error('Event not found')
      }

      const result = await ctx.db
        .update(events)
        .set(input.data)
        .where(eq(events.id, input.id))
        .returning()

      if (!result[0]) {
        throw new Error('Event not found')
      }
      return result[0]
    }),

  deleteEvent: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/events/{id}',
        description: 'Delete an event by its ID',
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the event's bot belongs to the user
      const event = await ctx.db
        .select({
          event: events,
          bot: bots,
        })
        .from(events)
        .leftJoin(bots, eq(events.botId, bots.id))
        .where(eq(events.id, input.id))

      if (!event[0] || !event[0].bot || event[0].bot.userId !== ctx.auth.userId) {
        throw new Error('Event not found')
      }

      const result = await ctx.db
        .delete(events)
        .where(eq(events.id, input.id))
        .returning()

      if (!result[0]) {
        throw new Error('Event not found')
      }
      return { message: 'Event deleted successfully' }
    }),
})
