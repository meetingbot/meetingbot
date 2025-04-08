// Mock types
export type Context = {
  db: Record<string, unknown>;
  session: null;
  headers: Headers;
};

// Mock functions
export const createTRPCContext = jest
  .fn()
  .mockImplementation(async (opts: { headers: Headers }) => ({
    db: {},
    session: null,
    ...opts,
  }));

// Mock tRPC utilities
export const createTRPCRouter = jest.fn();
export const createCallerFactory = jest.fn();

// Mock procedures
export const publicProcedure = {
  use: jest.fn().mockReturnThis(),
};
export const protectedProcedure = {
  use: jest.fn().mockReturnThis(),
};

// Mock error handling
export const TRPCError = {
  code: "INTERNAL_SERVER_ERROR",
  message: "Mock error",
  cause: null,
};
