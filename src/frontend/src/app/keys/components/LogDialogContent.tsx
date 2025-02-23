"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { DataTable } from "./DataTable";
import { logColumns } from "./LogColumns";
import { trpcReact } from "~/trpc/trpc-react";
import ErrorAlert from "~/app/components/ErrorAlert";
import TableSkeleton from "./TableSkeleton";

interface ViewLogsDialogProps {
  apiKeyId: number;
}

export function ViewLogsDialogContent({ apiKeyId }: ViewLogsDialogProps) {
  const {
    data: logsData,
    isLoading,
    error,
  } = trpcReact.apiKeys.getApiKeyLogs.useQuery({
    id: apiKeyId,
    limit: 100,
    offset: 0,
  });

  return (
    <>
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorAlert errorMessage={error.message} />
      ) : (
        <DataTable columns={logColumns} data={logsData?.logs || []} />
      )}
    </>
  );
}
