import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { ExpressAuthConfig } from '@auth/express'
import GitHub from '@auth/express/providers/github'
import { db } from '../db'

export const authConfig: ExpressAuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [GitHub],
  session: {
    strategy: 'database',
  },
  callbacks: {
    async redirect() {
      // always redirect to frontend url upon login
      return `${process.env.FRONTEND_URL}`
    },
    async session({ session, user }) {
      // Send properties to the client, using user instead of token since we're using database strategy
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }
    },
  },
  // Only enable debug in development
  debug: process.env.NODE_ENV === 'development',
}
