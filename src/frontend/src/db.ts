import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "./env";

const client = postgres(env.AUTH_DRIZZLE_URL + "?sslmode=require");
export const db = drizzle(client);
