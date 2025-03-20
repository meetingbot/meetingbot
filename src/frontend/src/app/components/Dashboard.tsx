import DashboardCard from "./DashboardCard";

import { useSession } from "~/contexts/SessionContext";
import CommunityCard from "./CommunityCard";
import { Bot, ChartLine, File, Key } from "lucide-react";
import { UsageChart } from "../usage/components/UsageChart";
import { trpcReact } from "~/trpc/trpc-react";
import { Skeleton } from "~/components/ui/skeleton";
import ErrorAlert from "~/components/custom/ErrorAlert";
import { env } from "~/env";
export default function Dashboard() {
  const { session } = useSession();
  const {
    data: activeBotCount,
    isLoading: activeBotCountLoading,
    error: activeBotCountError,
  } = trpcReact.bots.getActiveBotCount.useQuery({});

  const {
    data: keyCount,
    isLoading: keyCountLoading,
    error: keyCountError,
  } = trpcReact.apiKeys.getApiKeyCount.useQuery({});

  return (
    <>
      <div className="mb-5 mt-5">
        <h1 className="text-3xl font-bold">
          Welcome to Meeting Bot
          {session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-2 text-gray-600">
          Easily create automated applications that leverage recordings across
          popular video meeting platforms.
        </p>
      </div>
      <div>
        <div className="grid grid-cols-1 gap-6 lg:h-[48rem] lg:grid-cols-3">
          <div className="h-full lg:min-h-0">
            <DashboardCard
              title="Active Bots"
              className="h-full"
              content={
                activeBotCountLoading ? (
                  <Skeleton className="h-10 w-10" />
                ) : activeBotCountError ? (
                  <div className="text-4xl font-bold">
                    <ErrorAlert errorMessage={activeBotCountError.message} />
                  </div>
                ) : (
                  <div className="text-4xl font-bold">
                    {activeBotCount?.count}
                  </div>
                )
              }
              icon={<Bot />}
              link={{
                type: "INTERNAL",
                url: "/bots",
                text: "View Bots",
              }}
            />
          </div>
          <div className="h-full lg:min-h-0">
            <DashboardCard
              title="Active Keys"
              className="h-full"
              content={
                keyCountLoading ? (
                  <Skeleton className="h-10 w-10" />
                ) : keyCountError ? (
                  <div className="text-4xl font-bold">
                    <ErrorAlert errorMessage={keyCountError.message} />
                  </div>
                ) : (
                  <div className="text-4xl font-bold">{keyCount?.count}</div>
                )
              }
              icon={<Key />}
              link={{
                type: "INTERNAL",
                url: "/keys",
                text: "View Keys",
              }}
            />
          </div>
          <div className="h-full lg:min-h-0">
            <DashboardCard
              title="View our Docs"
              className="h-full"
              content="To learn more about how to create bots, pull meeting recordings, pull transcriptions and more, view our Documentation!"
              icon={<File className="text-slate-500" />}
              link={{
                type: "EXTERNAL",
                url: `${env.NEXT_PUBLIC_BACKEND_URL}/docs`,
                text: "View Documentation",
              }}
            />
          </div>
          <div className="h-[30rem] min-h-0 lg:row-span-2 lg:h-full">
            <CommunityCard className="h-full" />
          </div>
          <div className="h-[30rem] lg:col-span-2 lg:row-span-2 lg:min-h-0">
            <DashboardCard
              title="Your Recent Usage"
              className="h-full"
              content={<UsageChart />}
              link={{
                type: "INTERNAL",
                url: "/usage",
                text: "View Usage",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
