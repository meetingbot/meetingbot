import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";
import fs from "fs";

// Load env variables for tests
// Use the TEST_DATABASE_URL from the environment
// If not in CI environment, try to load from .test.env as fallback
if (!process.env.CI) {
  try {
    dotenv.config({ path: ".test.env" });
  } catch (error: unknown) {
    console.error("Error loading .test.env:", error instanceof Error ? error.message : String(error));
  }
}

// This will be our test database connection
let db: ReturnType<typeof drizzle> | null = null;
let conn: ReturnType<typeof postgres> | null = null;

// Setup function to be called before tests
export async function setupTestDb() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is not set in .test.env file");
  }
  
  // Validate database URL format
  if (!process.env.TEST_DATABASE_URL.startsWith('postgresql://') && 
      !process.env.TEST_DATABASE_URL.startsWith('postgres://')) {
    throw new Error(`Invalid TEST_DATABASE_URL format. Must start with postgresql:// or postgres://`);
  }
  
  // Log sanitized connection string (hide password)
  const sanitizedUrl = process.env.TEST_DATABASE_URL.replace(
    /(postgresql|postgres):\/\/([^:]+):([^@]+)@/,
    '$1://$2:****@'
  );
  console.log(`Connecting to test database: ${sanitizedUrl}`);
  
  // Get the connection string
  try {
    // Add a timeout to the connection to prevent hanging
    conn = postgres(process.env.TEST_DATABASE_URL, {
      ssl: {
        rejectUnauthorized: false,
      },
      max: 1,
      timeout: 10, // Connection timeout in seconds
      debug: true, // Enable debug logging
    });
    
    console.log("Successfully created postgres client");
  } catch (connectionError) {
    console.error("Failed to create database connection:", connectionError);
    throw new Error(`Database connection failed: ${String(connectionError)}`);
  }

  // Create a drizzle instance
  try {
    db = drizzle(conn, { schema });
    console.log("Successfully created drizzle instance");
    
    // Test the connection with a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("Database connection test successful:", result);
  } catch (drizzleError) {
    console.error("Failed to initialize Drizzle or connect to database:", drizzleError);
    
    // Clean up connection if Drizzle initialization failed
    if (conn) {
      try {
        await conn.end();
      } catch (endError) {
        console.error("Error closing connection after Drizzle initialization failure:", endError);
      }
    }
    
    throw new Error(`Drizzle initialization failed: ${String(drizzleError)}`);
  }

  // Find the correct migrations folder path
  const possiblePaths = [
    path.join(process.cwd(), "drizzle"),
    path.join(process.cwd(), "src", "server", "drizzle"),
    path.join(process.cwd(), "..", "drizzle"),
    // Add the exact path we found earlier
    path.join(process.cwd(), "src", "drizzle"), 
    // Try with absolute path
    path.join(process.cwd(), "../..", "src", "server", "drizzle")
  ];

  let migrationsFolder: string | null = null;
  for (const p of possiblePaths) {
    console.log(`Checking migration path: ${p}`);
    if (fs.existsSync(p)) {
      console.log(`Directory exists: ${p}`);
      const metaJournalPath = path.join(p, "meta", "_journal.json");
      if (fs.existsSync(metaJournalPath)) {
        migrationsFolder = p;
        console.log(`Found migrations folder at: ${migrationsFolder}`);
        break;
      } else {
        // Log what's in the directory to help debugging
        if (fs.existsSync(path.join(p, "meta"))) {
          console.log(`Meta directory exists but journal not found. Contents: ${fs.readdirSync(path.join(p, "meta")).join(', ')}`);
        } else {
          console.log(`Contents of ${p}: ${fs.readdirSync(p).join(', ')}`);
        }
      }
    }
  }

  if (!migrationsFolder) {
    console.error("Migrations folder not found. Check the folder structure.");
    throw new Error("Migrations folder not found. Test database schema cannot be guaranteed.");
  } else {
    try {
      console.log(`Applying migrations from ${migrationsFolder} to test database`);
      await migrate(db, { migrationsFolder });
      console.log("Test database migrations applied successfully");
    } catch (error) {
      console.error("Error applying migrations to test database:", error);
      throw new Error(`Failed to apply migrations: ${String(error)}`);
    }
  }

  // Return the database instance
  return { db };
}

// Cleanup function to be called after tests
export async function cleanupTestDb() {
  if (!db) {
    console.log("No database to clean up");
    return;
  }

  try {
    const query = sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

    const tables = await db.execute(query); // retrieve tables
    console.log("Tables to truncate:", tables);

    if (tables && Array.isArray(tables)) {
      for (const table of tables) {
        if (table && typeof table.table_name === 'string') {
          const truncateQuery = sql.raw(`TRUNCATE TABLE "${table.table_name}" CASCADE;`);
          await db.execute(truncateQuery); // Truncate (clear all the data) the table
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up test database:", error);
  } finally {
    // Close the connection
    if (conn) {
      try {
        await conn.end();
        console.log("Database connection closed");
      } catch (error) {
        console.error("Error closing database connection:", error);
      }
    }
  }
}

// Helper to get the database instance
export function getTestDb() {
  if (!db) {
    throw new Error("Database not initialized. Call setupTestDb() first.");
  }
  return db;
}
