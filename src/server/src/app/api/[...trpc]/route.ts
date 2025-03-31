import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { type NextRequest } from "next/server";
import { createOpenApiFetchHandler } from "trpc-to-openapi";

export const dynamic = "force-dynamic";

const handler = (req: NextRequest) => {
  // Handle incoming OpenAPI requests
  return createOpenApiFetchHandler({
    endpoint: "/api",
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    req,
  });
};

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
