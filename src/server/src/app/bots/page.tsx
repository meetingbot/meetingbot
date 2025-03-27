"use client";

import { useState } from "react";
import { DataTable } from "~/components/custom/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "~/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import Image from "next/image";
import { BotDetailsDialog } from "~/app/bots/components/BotDetailsDialog";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

export default function BotsPage() {
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const { data: bots = [], isLoading, error } = api.bots.getBots.useQuery({});
  type Bot = (typeof bots)[number];

  const columns: ColumnDef<Bot>[] = [
    {
      accessorKey: "meetingInfo.platform",
      header: "Platform",
      cell: ({ row }) => {
        const platform = row.original.meetingInfo.platform;
        return (
          <div className="flex items-center gap-2">
            {typeof platform === "string" && (
              <Image
                src={`/platform-logos/${platform}.svg`}
                alt={`${typeof platform === "string" ? platform : "Unknown"} logo`}
                width={20}
                height={20}
              />
            )}
            {typeof platform === "string"
              ? platform.charAt(0).toUpperCase() + platform.slice(1)
              : "Unknown"}
          </div>
        );
      },
    },
    {
      accessorKey: "recording",
      header: "Recording Length",
      cell: ({ row }) => {
        const recording = row.original.recording;
        return recording ? (
          <Link href={recording} target="_blank">
            {recording} <ExternalLinkIcon className="h-4 w-4" />
          </Link>
        ) : (
          "No Recording Available"
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        const timeAgo = createdAt
          ? formatDistanceToNow(new Date(createdAt), {
              addSuffix: true,
            })
          : "No date available";
        return `${timeAgo}`;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="outline"
            onClick={() => setSelectedBot(row.original.id)}
          >
            View Details
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bots</h2>
          <p className="text-muted-foreground">
            View and manage bots that have been created.
          </p>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={bots}
        isLoading={isLoading}
        errorMessage={error?.message}
      />
      <BotDetailsDialog
        botId={selectedBot}
        onClose={() => setSelectedBot(null)}
      />
    </div>
  );
}
