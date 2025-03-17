import { createTRPCRouter } from '../server/trpc.js'
import { botsRouter } from './bots'
import { eventsRouter } from './events'
import { apiKeysRouter } from './apiKeys'
import { usageRouter } from './usage'

export const appRouter = createTRPCRouter({
  bots: botsRouter,
  events: eventsRouter,
  apiKeys: apiKeysRouter,
  usage: usageRouter,
})

export type AppRouter = typeof appRouter
