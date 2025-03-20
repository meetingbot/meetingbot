"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { Button } from "~/components/ui/button";
import TableSkeleton from "./TableSkeleton";
import ErrorAlert from "~/components/custom/ErrorAlert";

type DataTableProps<TData, TValue> = {
  isLoading?: boolean;
  errorMessage?: string;
  columns?: ColumnDef<TData, TValue>[];
  data?: TData[];
};

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  errorMessage,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data: data ?? [],
    columns: columns ?? [],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {isLoading ? (
        <TableSkeleton />
      ) : errorMessage ? (
        <ErrorAlert errorMessage={errorMessage} />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table &&
                  columns &&
                  table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
              </TableHeader>
              <TableBody>
                {table && columns && table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns?.length ?? 1}
                      className="h-24 text-center"
                    >
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table?.previousPage()}
              disabled={!table?.getCanPreviousPage() || !table}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table?.nextPage()}
              disabled={!table?.getCanNextPage() || !table}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
