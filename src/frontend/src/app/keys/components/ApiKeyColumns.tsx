"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Copy } from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";
import { ViewLogsDialogContent } from "./LogDialogContent";
import { trpcReact } from "~/trpc/trpc-react";
import { toast } from "sonner";
import { DialogTitle } from "~/components/ui/dialog";
import { DialogContent } from "~/components/ui/dialog";
import { DialogHeader } from "~/components/ui/dialog";
import { Dialog } from "~/components/ui/dialog";

// Define the ApiKey type inline
type ApiKey = {
  id: number;
  name: string;
  userId: string;
  createdAt: Date | null;
  key: string;
  isRevoked: boolean | null;
};

export const columns = (
  setSelectedKeyId: (id: number) => void,
): ColumnDef<ApiKey>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue<Date>("createdAt");
      return date ? dayjs(date).format("MMMM D, YYYY") : "-";
    },
  },
  {
    accessorKey: "isRevoked",
    header: "Status",
    cell: ({ row }) => {
      const isRevoked = row.getValue("isRevoked");
      return (
        <Badge variant={isRevoked ? "destructive" : "default"}>
          {isRevoked ? "Revoked" : "Active"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const apiKey = row.original;
      return <ActionCell apiKey={apiKey} setSelectedKeyId={setSelectedKeyId} />;
    },
  },
];

// Create a proper React component for the actions cell
function ActionCell({ 
  apiKey, 
  setSelectedKeyId 
}: { 
  apiKey: ApiKey; 
  setSelectedKeyId: (id: number) => void;
}) {
  const [showLogs, setShowLogs] = useState(false);
  const utils = trpcReact.useUtils();

  const revokeKey = trpcReact.apiKeys.revokeApiKey.useMutation({
    onSuccess: async () => {
      await utils.apiKeys.listApiKeys.invalidate();
      toast.success("API Key revoked");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              navigator.clipboard.writeText(apiKey.key.toString())
            }
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Key
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSelectedKeyId(apiKey.id)}>
            View Logs
          </DropdownMenuItem>
          {!apiKey.isRevoked && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => revokeKey.mutate({ id: apiKey.id })}
            >
              Revoke Key
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showLogs} onOpenChange={setShowLogs}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>API Key Logs</DialogTitle>
            {showLogs && <ViewLogsDialogContent apiKeyId={apiKey.id} />}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
