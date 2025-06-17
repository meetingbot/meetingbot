// Move this to the top of the file - before any imports
jest.mock('~/server/api/services/botDeployment');
jest.mock('~/server/utils/s3');

import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import { setupTestDb, cleanupTestDb, getTestDb } from "~/server/test/setup";
import * as schema from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { EventCode } from "~/server/db/schema";
import { fail } from "assert";

// Polyfill for setImmediate in Jest environment
if (typeof globalThis.setImmediate === 'undefined') {
  // Polyfill setImmediate in test environment
  Object.defineProperty(globalThis, 'setImmediate', {
    value: (callback: (...args: unknown[]) => void, ...args: unknown[]) => setTimeout(callback, 0, ...args),
    configurable: true,
    enumerable: true,
    writable: true
  });
}

// Polyfill for clearImmediate in Jest environment
if (typeof globalThis.clearImmediate === 'undefined') {
  // Polyfill clearImmediate in test environment
  Object.defineProperty(globalThis, 'clearImmediate', {
    value: (immediateId: ReturnType<typeof setTimeout>) => clearTimeout(immediateId),
    configurable: true,
    enumerable: true,
    writable: true
  });
}

// Get the real database instance
let testDb: ReturnType<typeof getTestDb>;

// Setup before all tests
beforeAll(async () => {
  // Setup the test database
  const setup = await setupTestDb();
  testDb = setup.db;

  try {
    console.log("Setting up test database for events test...");
    
    // Verify database connection
    const connectionTest = await testDb.execute(sql`SELECT 1 as connection_test`);
    console.log("Database connection test:", connectionTest);
    
    // Debug: List all tables in the database to verify schema
    const tables = await testDb.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:", tables);
    
    // Reset sequences to avoid ID conflicts
    await testDb.execute(sql`SELECT setval(pg_get_serial_sequence('bots', 'id'), 1, false)`);
    
    // Clear the database (start with a clean slate)
    console.log("Truncating tables...");
    await testDb.execute(sql`TRUNCATE TABLE bots CASCADE`);
    await testDb.execute(sql`TRUNCATE TABLE events CASCADE`);
    
    // Debug: Verify that the user table actually exists
    const userTableCheck = await testDb.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user'
    `);
    console.log("User table check:", userTableCheck);
    
    // Insert the test user directly
    console.log("Creating test user...");
    
    // Try inserting user with Drizzle ORM
    await testDb.insert(schema.users).values({
      id: "00000000-0000-4000-a000-000000000000",
      name: "Test User",
      email: "test@example.com",
      createdAt: new Date()
    }).onConflictDoNothing();
    
    // Verify the user exists in the database
    const userCheck = await testDb.execute(sql`
      SELECT * FROM "user" WHERE id = '00000000-0000-4000-a000-000000000000'
    `);
    console.log("User verification check:", userCheck);
    
    // Also verify the test user by using the schema objects
    const userSchemaCheck = await testDb.select().from(schema.users);
    console.log("User schema check:", userSchemaCheck);
    
    if (!userSchemaCheck || userSchemaCheck.length === 0) {
      console.error("Failed to create test user - user table may be empty");
      throw new Error("Failed to create test user - schema check failed");
    }
    
    console.log("Test user verified successfully");
  } catch (error) {
    console.error("Error during test setup:", error);
    throw error;
  }
}, 60000); // Increase timeout for container startup

// Cleanup after all tests
afterAll(async () => {
  // Cleanup the test database
  await cleanupTestDb();
}, 30000); // Increase timeout for container shutdown

export type Context = {
  db: PostgresJsDatabase<typeof schema>;
  session: {
    user: {
      id: string;
    };
  };
  headers: Headers;
};

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({});

// Mock the trpc module to use our real database
jest.mock("~/server/api/trpc", () => {
  return {
    createTRPCContext: jest
      .fn()
      .mockImplementation(async (opts: { headers: Headers }) => ({
        db: testDb,
        session: {
          user: {
            id: "00000000-0000-4000-a000-000000000000", // Valid UUID format
          },
        },
        ...opts,
      })),

    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    publicProcedure: t.procedure,
    protectedProcedure: t.procedure,
    TRPCError: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Mock error",
      cause: null,
    },
  };
});

const { eventsRouter } = require("../events") as typeof import("../events");
const { botsRouter } = require("../bots") as typeof import("../bots");
const { createTRPCContext } =
  require("~/server/api/trpc") as typeof import("~/server/api/trpc");

describe("eventsRouter", () => {
  let testBotId: number;
  
  // Create a test bot and events before running any tests
  beforeAll(async () => {
    // Create a test bot
    const botsCaller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const bot = await botsCaller.createBot({
      botDisplayName: "Test Events Bot",
      meetingTitle: "Test Events Meeting",
      meetingInfo: {
        platform: "zoom",
        meetingUrl: "https://zoom.us/events-test",
      },
      startTime: new Date(Date.now() + 3600000), // 1 hour in the future
      endTime: new Date(Date.now() + 7200000),   // 2 hours in the future
      heartbeatInterval: 5000,
      automaticLeave: {
        waitingRoomTimeout: 300000,
        noOneJoinedTimeout: 300000, 
        everyoneLeftTimeout: 300000,
        inactivityTimeout: 300000,
      }
    });
    
    testBotId = bot.id;
    
    // Create some test events
    const eventsCaller = eventsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );
    
    // Create a series of events
    await eventsCaller.createEvent({
      botId: testBotId,
      eventType: "READY_TO_DEPLOY" as EventCode,
      eventTime: new Date(),
      data: { message: "Bot started successfully" },
    });
    
    await eventsCaller.createEvent({
      botId: testBotId,
      eventType: "JOINING_CALL" as EventCode,
      eventTime: new Date(Date.now() + 60000), // 1 minute later
      data: { message: "Successfully joined the meeting" },
    });
    
    await eventsCaller.createEvent({
      botId: testBotId,
      eventType: "PARTICIPANT_JOIN" as EventCode,
      eventTime: new Date(Date.now() + 120000), // 2 minutes later
      data: { 
        participantId: "participant-123"
      },
    });
  }, 30000);
  
  it("should get events for a specific bot", async () => {
    const caller = eventsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const result = await caller.getEventsForBot({ botId: testBotId });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(3);
    
    // Check that all events belong to our test bot
    result.forEach(event => {
      expect(event.botId).toBe(testBotId);
    });
    
    // Verify we have the expected event types
    const eventTypes = result.map(event => event.eventType);
    expect(eventTypes).toContain("READY_TO_DEPLOY");
    expect(eventTypes).toContain("JOINING_CALL");
    expect(eventTypes).toContain("PARTICIPANT_JOIN");
  }, 15000);
  
  it("should allow creating an event", async () => {
    const caller = eventsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const newEvent = await caller.createEvent({
      botId: testBotId,
      eventType: "CALL_ENDED" as EventCode,
      eventTime: new Date(),
      data: { description: "Meeting ended by host" },
    });
    
    expect(newEvent).toBeDefined();
    expect(newEvent.botId).toBe(testBotId);
    expect(newEvent.eventType).toBe("CALL_ENDED");
    
    // Verify the event was properly saved by retrieving it
    const events = await caller.getEventsForBot({ botId: testBotId });
    const foundEvent = events.find(e => e.id === newEvent.id);
    
    expect(foundEvent).toBeDefined();
    expect(foundEvent?.data).toEqual({ description: "Meeting ended by host" });
  }, 15000);
  
  it("should handle attempting to get events for a non-existent bot", async () => {
    const caller = eventsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    // Try to get events for a non-existent bot ID
    try {
      await caller.getEventsForBot({ botId: 999999 });
      fail("Should have thrown an error for non-existent bot");
    } catch (error) {
      expect((error as Error).message).toBe("Bot not found");
    }
  }, 15000);
  
  it("should handle attempting to get events for a bot that doesn't belong to the user", async () => {
    // First, create a bot with a different user ID
    const differentUserId = "11111111-1111-4000-a000-000000000000";
    
    try {
      // Create a different user with Drizzle ORM
      await testDb.insert(schema.users).values({
        id: differentUserId,
        name: "Different User",
        email: "different@example.com",
        createdAt: new Date()
      }).onConflictDoNothing();
      
      // Verify the different user exists
      const differentUserCheck = await testDb.select().from(schema.users)
        .where(eq(schema.users.id, differentUserId));
      
      if (!differentUserCheck || differentUserCheck.length === 0) {
        console.error("Different user not inserted properly!");
        return; // Skip this test if the user couldn't be inserted
      }
      
      console.log("Different user verified successfully");
      
      // Create a bot owned by the different user
      const otherUserBot = await testDb.insert(schema.bots).values({
        botDisplayName: "Other User's Bot",
        meetingTitle: "Other User's Meeting",
        meetingInfo: {
          platform: "zoom",
          meetingUrl: "https://zoom.us/other-user",
        },
        userId: differentUserId,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
        // Add required fields
        heartbeatInterval: 5000,
        automaticLeave: {
          waitingRoomTimeout: 300000,
          noOneJoinedTimeout: 300000,
          everyoneLeftTimeout: 300000,
          inactivityTimeout: 300000,
        }
      }).returning();
      
      const caller = eventsRouter.createCaller(
        await createTRPCContext({
          headers: new Headers(),
        }),
      );
      
      // Try to get events for a bot that doesn't belong to our test user
      if (otherUserBot[0]) {
        try {
          await caller.getEventsForBot({ botId: otherUserBot[0].id });
          fail("Should have thrown an error for bot belonging to another user");
        } catch (error) {
          expect((error as Error).message).toBe("Bot not found");
        }
      }
    } catch (error) {
      console.error("Error in test:", error);
      throw error;
    }
  }, 15000);
}); 