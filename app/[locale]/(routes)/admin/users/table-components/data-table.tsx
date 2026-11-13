"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function AdminUserDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const renderRowCell = (row: Row<TData>, columnId: string) => {
    const cell = row.getAllCells().find((item) => item.column.id === columnId);
    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
  };

  return (
    <div className="space-y-5 pt-5">
      <DataTableToolbar table={table} />
      <div className="space-y-3 md:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <article key={row.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h3 className="break-words font-medium">{renderRowCell(row, "name")}</h3>
                  <div className="break-all text-sm text-muted-foreground">{renderRowCell(row, "email")}</div>
                </div>
                <div className="shrink-0">{renderRowCell(row, "actions")}</div>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t pt-3 text-sm">
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">Role</dt><dd className="break-words">{renderRowCell(row, "role")}</dd></div>
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">Status</dt><dd>{renderRowCell(row, "userStatus")}</dd></div>
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">Last login</dt><dd className="break-words">{renderRowCell(row, "lastLoginAt")}</dd></div>
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">Date created</dt><dd className="break-words">{renderRowCell(row, "created_on")}</dd></div>
                <div className="min-w-0"><dt className="text-xs text-muted-foreground">Language</dt><dd>{renderRowCell(row, "userLanguage")}</dd></div>
              </dl>
            </article>
          ))
        ) : (
          <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">No results.</div>
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-md border md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
