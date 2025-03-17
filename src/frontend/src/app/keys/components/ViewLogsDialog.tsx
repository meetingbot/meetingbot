"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { DataTable } from "~/components/custom/DataTable";
import { logColumns } from "./LogColumns";
import { trpcReact } from "~/trpc/trpc-react";

interface ViewLogsDialogProps {
  apiKeyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewLogsDialog({
  apiKeyId,
  open,
  onOpenChange,
}: ViewLogsDialogProps) {
  const {
    data: logsData,
    isLoading,
    error,
  } = trpcReact.apiKeys.getApiKeyLogs.useQuery(
    {
      id: apiKeyId!,
      limit: 100,
      offset: 0,
    },
    {
      enabled: open && apiKeyId !== null,
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>API Key Logs</DialogTitle>
        </DialogHeader>
        <DataTable
          columns={logColumns}
          data={logsData?.logs}
          isLoading={isLoading}
          errorMessage={error?.message}
        />
      </DialogContent>
    </Dialog>
  );
}
