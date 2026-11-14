"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
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
import { PanelTopClose, PanelTopOpen } from "lucide-react";
import { createColumns } from "./columns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { LeadFieldSettings } from "@/lib/crm/leads/field-settings-shared";

type ConfigItem = { id: string; name: string };

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  leadSources?: ConfigItem[];
  leadStatuses?: ConfigItem[];
  leadTypes?: ConfigItem[];
  leadFieldSettings: LeadFieldSettings;
}

export function LeadDataTable<TData, TValue>({
  data,
  leadSources = [],
  leadStatuses = [],
  leadTypes = [],
  leadFieldSettings,
}: DataTableProps<TData, TValue>) {
  const columns = createColumns(leadSources, leadStatuses, leadTypes, leadFieldSettings) as ColumnDef<TData, TValue>[];
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const [hide, setHide] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const lead = row.original as any;
      const search = String(filterValue || "").trim().toLowerCase();
      if (!search) return true;
      const values = [
        lead.firstName,
        lead.lastName,
        lead.company,
        lead.email,
        lead.phone,
        lead.refered_by,
        lead.lead_status?.name,
        lead.lead_source?.name,
        lead.assigned_to_user?.name,
      ];
      return values.some((value) => String(value || "").toLowerCase().includes(search));
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <p className="text-sm font-medium">Lead workspace</p>
          <p className="text-xs text-muted-foreground">Search clients, filter by stage or source, and open a record to continue the conversation.</p>
        </div>
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
            <span className="text-sm text-muted-foreground">Lead list hidden.</span> Click on <PanelTopOpen /> to show it.
        </div>
      ) : (
        <>
          <DataTableToolbar table={table} leadStatuses={leadStatuses} leadSources={leadSources} />
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <Table data-testid="leads-table">
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
                      No leads match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden" data-testid="leads-mobile-cards">
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => {
              const lead = row.original as any;
              const stage = leadStatuses.find((item) => item.id === lead.lead_status_id)?.name;
              const source = lead.refered_by ? `Referral · ${lead.refered_by}` : leadSources.find((item) => item.id === lead.lead_source_id)?.name;
              const actions = row.getVisibleCells().find((cell) => cell.column.id === "actions");
              return (
                <article key={row.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/crm/leads/${lead.id}`} target="_blank" rel="noreferrer" className="block truncate font-semibold hover:text-primary hover:underline">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "New enquiry"}</Link>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{lead.company || lead.assigned_accounts?.name || "Residential client"}</p>
                    </div>
                    {actions ? flexRender(actions.column.columnDef.cell, actions.getContext()) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={stage ? "secondary" : "outline"}>{stage || "Stage not set"}</Badge>
                    {source ? <Badge variant="outline">{source}</Badge> : null}
                  </div>
                  <div className="mt-3 grid gap-1 border-t pt-3 text-sm sm:grid-cols-2">
                    <span>{lead.phone || "No phone"}</span>
                    <span className="truncate text-muted-foreground">{lead.email || "No email"}</span>
                    <span className="text-muted-foreground">Owner: {lead.assigned_to_user?.name || "Unassigned"}</span>
                    <span className="text-muted-foreground">Added: {lead.createdAt ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(lead.createdAt)) : "—"}</span>
                  </div>
                </article>
              );
            }) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No leads match these filters.</div>}
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
