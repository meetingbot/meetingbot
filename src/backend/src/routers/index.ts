import { createTRPCRouter } from '../server/trpc.js'
import { botsRouter } from './bots'
import { usersRouter } from './users'

export const appRouter = createTRPCRouter({
  bots: botsRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
