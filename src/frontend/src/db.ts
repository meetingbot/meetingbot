import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "./env";

const client = postgres(env.AUTH_DRIZZLE_URL, {
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
});

export const db = drizzle(client);
