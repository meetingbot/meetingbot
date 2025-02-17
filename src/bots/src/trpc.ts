import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "../../backend/src/routers";
import superjson from "superjson";

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: process.env.BACKEND_URL || "http://127.0.0.1:3001/api/trpc",
    }),
  ],
});
