"use client";

import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";

type ApiKeyLog = {
  id: number;
  apiKeyId: number;
  method: string;
  path: string;
  statusCode: number;
  createdAt: Date | null;
};

export const logColumns: ColumnDef<ApiKeyLog>[] = [
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => {
      const method = row.getValue("method") as string;
      return <span className="font-mono">{method}</span>;
    },
  },
  {
    accessorKey: "path",
    header: "Path",
    cell: ({ row }) => {
      const path = row.getValue("path") as string;
      return <span className="font-mono">{path}</span>;
    },
  },
  {
    accessorKey: "statusCode",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusCode") as number;
      return (
        <span
          className={`font-mono ${
            status >= 200 && status < 300
              ? "text-green-600"
              : status >= 400
                ? "text-red-600"
                : "text-yellow-600"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date | null;
      return date ? dayjs(date).format("MMM D, YYYY HH:mm:ss") : "-";
    },
  },
];
