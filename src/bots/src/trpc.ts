import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "../../server/src/server/api/root";
import superjson from "superjson";

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: process.env.BACKEND_URL || "http://localhost:3001/api/trpc",
    }),
  ],
});
