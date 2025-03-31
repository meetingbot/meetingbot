"use client";

import DashboardCard from "./DashboardCard";
import CommunityCard from "./CommunityCard";
import { Bot, File, Key } from "lucide-react";
import { UsageChart } from "../usage/components/UsageChart";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import ErrorAlert from "~/components/custom/ErrorAlert";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  const {
    data: activeBotCount,
    isLoading: activeBotCountLoading,
    error: activeBotCountError,
  } = api.bots.getActiveBotCount.useQuery({});

  const {
    data: keyCount,
    isLoading: keyCountLoading,
    error: keyCountError,
  } = api.apiKeys.getApiKeyCount.useQuery({});

  return (
    <>
      <div className="mt-5 mb-5">
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
          <DashboardCard
            title="Active Bots"
            className="h-full min-h-56"
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
          <DashboardCard
            title="Active Keys"
            className="h-full min-h-56"
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
          <DashboardCard
            title="View our Docs"
            className="h-full min-h-56"
            content="To learn more about how to create bots, pull meeting recordings, pull transcriptions and more, view our Documentation!"
            icon={<File className="text-slate-500" />}
            link={{
              type: "INTERNAL",
              url: "/docs",
              text: "View Documentation",
            }}
          />
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
