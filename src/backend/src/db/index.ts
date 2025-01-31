import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

import * as schema from './schema'
import * as dotenv from 'dotenv'
dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
  migrated: boolean | undefined
}

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, {
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
})

if (process.env.NODE_ENV !== 'production') globalForDb.conn = client

export const db = drizzle(client, { schema })

// Create tables if they don't exist
async function setupDatabase() {
  // Skip if we've already run migrations in this process (for development HMR)
  if (process.env.NODE_ENV !== 'production' && globalForDb.migrated) {
    return
  }

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('Database setup completed successfully')
    if (process.env.NODE_ENV !== 'production') {
      globalForDb.migrated = true
    }
  } catch (error) {
    // Only log the error if it's not about existing tables
    if (error instanceof Error && !error.message?.includes('already exists')) {
      console.error('Error setting up database:', error)
    }
  }
}

// Run setup on startup
setupDatabase().catch(console.error)
