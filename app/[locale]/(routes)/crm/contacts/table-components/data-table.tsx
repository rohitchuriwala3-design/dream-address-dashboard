"use client";

import * as React from "react";
import {
  ColumnDef,
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
import { PanelTopClose, PanelTopOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkEnrichModal } from "../components/BulkEnrichModal";
import { useCrmTableViewPreferences } from "@/lib/crm/table-view-preferences";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ContactsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const preferences = useCrmTableViewPreferences("contacts");

  const [hide, setHide] = React.useState(false);
  const [bulkEnrichOpen, setBulkEnrichOpen] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: preferences.state.sorting,
      columnVisibility: preferences.state.columnVisibility,
      rowSelection,
      columnFilters: preferences.state.columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: preferences.onSortingChange,
    onColumnFiltersChange: preferences.onColumnFiltersChange,
    onColumnVisibilityChange: preferences.onColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-start gap-3">
        <div></div>
        <div className="flex justify-end space-x-2">
          {hide ? (
            <PanelTopOpen
              onClick={() => setHide(!hide)}
              className="text-muted-foreground"
            />
          ) : (
            <PanelTopClose
              onClick={() => setHide(!hide)}
              className="text-muted-foreground"
            />
          )}
        </div>
      </div>

      {hide ? (
        <div className="flex gap-2">
          This content is hidden now. Click on <PanelTopOpen /> to show content
        </div>
      ) : (
        <>
          <DataTableToolbar table={table} />
          {table.getSelectedRowModel().rows.length > 0 && (
            <>
              <div className="flex items-center gap-2 py-2 px-1 bg-muted/50 rounded-md border">
                <span className="text-sm text-muted-foreground">
                  {table.getSelectedRowModel().rows.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkEnrichOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-1 text-orange-500" />
                  Enrich {table.getSelectedRowModel().rows.length} contacts
                </Button>
              </div>
              <BulkEnrichModal
                contactIds={table.getSelectedRowModel().rows.map((row) => (row.original as { id: string }).id)}
                open={bulkEnrichOpen}
                onOpenChange={setBulkEnrichOpen}
              />
            </>
          )}
          <div className="rounded-md border overflow-x-auto w-full">
            <Table data-testid="contacts-table">
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
        </>
      )}
    </div>
  );
}
