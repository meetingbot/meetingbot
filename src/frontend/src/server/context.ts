import { getServerSession } from "next-auth";
import { authOptions } from "./auth/config";
import type * as trpcNext from "@trpc/server/adapters/next";
import { db } from "~/server/db";

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/context
 */
export async function createContext({
  req,
  res,
}: trpcNext.CreateNextContextOptions) {
  const session = await getServerSession(req, res, authOptions);

  return {
    auth: session,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
