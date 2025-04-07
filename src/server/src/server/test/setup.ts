import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".test.env" });

// This will be our test database connection
let db: ReturnType<typeof drizzle> | null = null;

// Setup function to be called before tests
export async function setupTestDb() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is not set");
  }
  // Get the connection string
  const conn = postgres(process.env.TEST_DATABASE_URL, {
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
  });

  // Create a drizzle instance
  db = drizzle(conn, { schema });

  // Run migrations if needed
  const migrationsFolder = path.join(process.cwd(), "src/server/drizzle");

  try {
    await migrate(db, { migrationsFolder });
    console.log("Test database migrations applied successfully");
  } catch (error) {
    console.error("Error applying migrations to test database:", error);
    // Continue anyway, as the schema might already be in place
  }

  // Return the database instance
  return { db };
}

// Cleanup function to be called after tests
export async function cleanupTestDb() {
  const query = sql<string>`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

  const tables = await db?.execute(query); // retrieve tables
  console.log(tables);

  for (const table of tables) {
    const query = sql.raw(`TRUNCATE TABLE ${table.table_name} CASCADE;`);
    await db?.execute(query); // Truncate (clear all the data) the table
  }
}

// Helper to get the database instance
export function getTestDb() {
  if (!db) {
    throw new Error("Database not initialized. Call setupTestDb() first.");
  }
  return db;
}
