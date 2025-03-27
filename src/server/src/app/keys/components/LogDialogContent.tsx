"use client";

import { DataTable } from "~/components/custom/DataTable";
import { logColumns } from "./LogColumns";
import { api } from "~/trpc/react";

interface ViewLogsDialogProps {
  apiKeyId: number;
}

export function ViewLogsDialogContent({ apiKeyId }: ViewLogsDialogProps) {
  const {
    data: logsData,
    isLoading,
    error,
  } = api.apiKeys.getApiKeyLogs.useQuery({
    id: apiKeyId,
    limit: 100,
    offset: 0,
  });

  return (
    <>
      <DataTable
        columns={logColumns}
        data={logsData?.logs}
        isLoading={isLoading}
        errorMessage={error?.message}
      />
    </>
  );
}
