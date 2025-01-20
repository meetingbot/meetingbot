import { createTRPCRouter } from '../server/trpc.js'
import { botsRouter } from './bots'
import { eventsRouter } from './events'
import { usersRouter } from './users'

export const appRouter = createTRPCRouter({
  bots: botsRouter,
  events: eventsRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
