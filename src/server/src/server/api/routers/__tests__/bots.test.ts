// Move this to the top of the file - before any imports
jest.mock('~/server/api/services/botDeployment');
jest.mock('~/server/utils/s3');

import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import { setupTestDb, cleanupTestDb, getTestDb } from "~/server/test/setup";
import * as schema from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
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
    console.log("Setting up test database...");
    
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
    
    // Direct SQL insert to ensure the user is created correctly
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

const { botsRouter } = require("../bots") as typeof import("../bots");
const { createTRPCContext } =
  require("~/server/api/trpc") as typeof import("~/server/api/trpc");

describe("botsRouter", () => {
  let testBotId: number;
  
  // Create a test bot before running any tests
  beforeAll(async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const bot = await caller.createBot({
      botDisplayName: "Test Bot",
      meetingTitle: "Test Meeting",
      meetingInfo: {
        platform: "zoom",
        meetingUrl: "https://zoom.us/test",
      },
      startTime: new Date(Date.now() + 3600000), // 1 hour in the future
      endTime: new Date(Date.now() + 7200000),   // 2 hours in the future
      heartbeatInterval: 5000,
      automaticLeave: {
        waitingRoomTimeout: 300000,
        noOneJoinedTimeout: 300000, 
        everyoneLeftTimeout: 300000,
      }
    });
    
    testBotId = bot.id;
  }, 15000);
  
  it("should create a bot", async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const result = await caller.createBot({
      botDisplayName: "Test Create Bot",
      meetingTitle: "Test Create Meeting",
      meetingInfo: {
        platform: "zoom",
        meetingUrl: "https://zoom.us/create",
      },
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 7200000),
      heartbeatInterval: 5000,
      automaticLeave: {
        waitingRoomTimeout: 300000,
        noOneJoinedTimeout: 300000, 
        everyoneLeftTimeout: 300000,
      }
    });

    expect(result).toBeDefined();
    expect(result.botDisplayName).toBe("Test Create Bot");
    expect(result.meetingTitle).toBe("Test Create Meeting");
  }, 15000);

  it("should get all bots", async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const result = await caller.getBots({});
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  }, 15000);

  it("should get a specific bot by ID", async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const result = await caller.getBot({ id: testBotId });
    
    expect(result).toBeDefined();
    expect(result.id).toBe(testBotId);
    expect(result.botDisplayName).toBe("Test Bot");
  }, 15000);

  it("should update a bot", async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const updatedTitle = "Updated Test Meeting";
    
    const result = await caller.updateBot({
      id: testBotId,
      data: {
        meetingTitle: updatedTitle,
      },
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBe(testBotId);
    expect(result.meetingTitle).toBe(updatedTitle);
  }, 15000);

  it("should deploy a bot", async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const result = await caller.deployBot({
      id: testBotId,
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBe(testBotId);
    expect(result.status).toBe("JOINING_CALL");
  }, 15000);

  it("should get a signed recording URL", async () => {
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    // First update the bot to have a recording
    await testDb
      .update(schema.bots)
      .set({ recording: "test-recording.mp4" })
      .where(eq(schema.bots.id, testBotId));
    
    const result = await caller.getSignedRecordingUrl({
      id: testBotId,
    });
    
    expect(result).toBeDefined();
    expect(result.recordingUrl).toBe("https://mock-signed-url.com/recording.mp4");
  }, 15000);

  it("should delete a bot", async () => {
    // Create a new bot specifically for deletion test
    const caller = botsRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const newBot = await caller.createBot({
      botDisplayName: "Delete Test Bot",
      meetingTitle: "Delete Test Meeting",
      meetingInfo: {
        platform: "zoom",
        meetingUrl: "https://zoom.us/delete",
      },
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 7200000),
      heartbeatInterval: 5000,
      automaticLeave: {
        waitingRoomTimeout: 300000,
        noOneJoinedTimeout: 300000, 
        everyoneLeftTimeout: 300000,
      }
    });
    
    const deleteResult = await caller.deleteBot({
      id: newBot.id,
    });
    
    expect(deleteResult).toBeDefined();
    expect(deleteResult.message).toBe("Bot deleted successfully");
    
    // Verify the bot was actually deleted
    try {
      await caller.getBot({ id: newBot.id });
      fail("Bot should have been deleted");
    } catch (error) {
      expect((error as Error).message).toBe("Bot not found");
    }
  }, 15000);
}); 