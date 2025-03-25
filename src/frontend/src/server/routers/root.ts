import { botsRouter } from "./bots";
import { eventsRouter } from "./events";
import { apiKeysRouter } from "./apiKeys";
import { usageRouter } from "./usage";
import { communityRouter } from "./community";
import { router } from "../trpc";

export const appRouter = router({
  bots: botsRouter,
  events: eventsRouter,
  apiKeys: apiKeysRouter,
  usage: usageRouter,
  community: communityRouter,
});

export type AppRouter = typeof appRouter;
