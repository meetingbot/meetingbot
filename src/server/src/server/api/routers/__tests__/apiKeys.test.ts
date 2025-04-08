import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "trpc-to-openapi";
import { setupTestDb, cleanupTestDb, getTestDb } from "~/server/test/setup";
import * as schema from "~/server/db/schema";

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

  // Insert the test user with the same UUID used in the mock
  await testDb.insert(schema.users).values({
    id: "00000000-0000-4000-a000-000000000000",
    name: "Test User",
    email: "test@example.com",
    createdAt: new Date()
  }).onConflictDoNothing();
}, 60000); // Increase timeout for container startup

// Cleanup after all tests
afterAll(async () => {
  // Cleanup the test database
  await cleanupTestDb();
}, 30000); // Increase timeout for container shutdown

export type Context = {
  db: Record<string, unknown>;
  session: null;
  headers: Headers;
};

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<{
    db: Record<string, unknown>;
    session: null;
    headers: Headers;
  }>()
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

const { apiKeysRouter } = require("../apiKeys") as typeof import("../apiKeys");
const { createTRPCContext } =
  require("~/server/api/trpc") as typeof import("~/server/api/trpc");

describe("apiKeysRouter", () => {
  it("should create an API key", async () => {
    const caller = apiKeysRouter.createCaller(
      await createTRPCContext({
        headers: new Headers(),
      }),
    );

    const result = await caller.createApiKey({
      name: "test-api-key",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("test-api-key");
  }, 15000); // Increase test timeout to 15 seconds

  // Add more test cases here
});
