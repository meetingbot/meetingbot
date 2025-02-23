import { createTRPCRouter } from '../server/trpc.js'
import { botsRouter } from './bots'
import { eventsRouter } from './events'
import { apiKeysRouter } from './apiKeys'

export const appRouter = createTRPCRouter({
  bots: botsRouter,
  events: eventsRouter,
  apiKeys: apiKeysRouter,
})

export type AppRouter = typeof appRouter
