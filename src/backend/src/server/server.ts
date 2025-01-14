import { createTRPCRouter } from './trpc.js'
import { botsRouter } from '../routers/bots'
import { usersRouter } from '../routers/users'

export const appRouter = createTRPCRouter({
  bots: botsRouter,
  users: usersRouter,
})

export type AppRouter = typeof appRouter
