import { cache } from "react";
import NextAuth from "next-auth";
import { authOptions } from "./config";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authOptions);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
