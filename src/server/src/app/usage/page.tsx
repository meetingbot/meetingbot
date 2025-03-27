"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "~/components/ui/skeleton";

// Dynamically import the chart component with SSR disabled
const UsageChart = dynamic(
  () => import("./components/UsageChart").then((mod) => mod.UsageChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  },
);

export default function Keys() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usage</h2>
          <p className="text-muted-foreground">Track your bot usage</p>
        </div>
      </div>

      <UsageChart />
    </div>
  );
}
