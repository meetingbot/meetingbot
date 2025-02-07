import { z } from 'zod'
import { createTRPCRouter, procedure } from '../server/trpc'
import {
  events,
  insertEventSchema,
  selectEventSchema,
  EVENT_DESCRIPTIONS,
} from '../db/schema'
import { eq } from 'drizzle-orm'

export const eventsRouter = createTRPCRouter({
  getAllEvents: procedure
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
      return await ctx.db.select().from(events)
    }),

  getEventsForBot: procedure
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
      return await ctx.db
        .select()
        .from(events)
        .where(eq(events.botId, input.botId))
    }),

  getEvent: procedure
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
      const result = await ctx.db
        .select()
        .from(events)
        .where(eq(events.id, input.id))

      if (!result[0]) {
        throw new Error('Event not found')
      }
      return result[0]
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

  updateEvent: procedure
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

  deleteEvent: procedure
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
