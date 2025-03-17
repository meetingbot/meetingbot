"use client";

import { columns } from "./components/ApiKeyColumns";
import { DataTable } from "~/components/custom/DataTable";
import { trpcReact } from "~/trpc/trpc-react";
import { CreateApiKeyDialog } from "./components/CreateApiKeyDialog";
import { ViewLogsDialog } from "./components/ViewLogsDialog";
import { useState } from "react";

export default function Keys() {
  const [selectedViewLogsKeyId, setSelectedViewLogsKeyId] = useState<
    number | null
  >(null);
  const {
    data: apiKeys,
    isLoading,
    error,
  } = trpcReact.apiKeys.listApiKeys.useQuery({});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API keys and their permissions.
          </p>
        </div>
        <CreateApiKeyDialog />
      </div>
      <DataTable
        columns={columns(setSelectedViewLogsKeyId)}
        data={apiKeys}
        isLoading={isLoading}
        errorMessage={error?.message}
      />
      <ViewLogsDialog
        apiKeyId={selectedViewLogsKeyId}
        open={selectedViewLogsKeyId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedViewLogsKeyId(null);
        }}
      />
    </div>
  );
}
