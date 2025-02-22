import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { env } from "./env";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
  ],
  adapter: DrizzleAdapter(db),
  callbacks: {
    async session({ session, user }) {
      // Send session data to your backend
      if (session.user) {
        const response = await fetch(`${env.BACKEND_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }),
        });

        if (!response.ok) {
          console.error("Failed to sync user with backend");
        }
      }
      return session;
    },
    authorized: async ({ auth }) => {
      return !!auth?.user;
    },
  },
});
