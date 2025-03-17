"use client";

import { trpcReact } from "~/trpc/trpc-react";
import { UsageChart } from "./components/UsageChart";
import ErrorAlert from "../components/ErrorAlert";

export default function Keys() {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usage</h2>
          <p className="text-muted-foreground">
            Track your bot usage
          </p>
        </div>
      </div>

      <UsageChart />
    </div>
  );
}
