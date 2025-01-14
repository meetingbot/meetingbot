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
}

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, {
  ssl:
    process.env.NODE_ENV === 'production'
      ? true
      : {
          rejectUnauthorized: false,
        },
})

if (process.env.NODE_ENV !== 'production') globalForDb.conn = client

export const db = drizzle(client, { schema })

// Create tables if they don't exist
async function createTables() {
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' })
    console.log('Tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

// Run migration on startup
createTables().catch(console.error)
