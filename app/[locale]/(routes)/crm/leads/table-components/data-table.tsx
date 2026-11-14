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
import { type LeadFilterSet } from "./advanced-lead-filters";
import { leadMatchesAdvancedFilters, sanitizeLeadFilterSet } from "./lead-filter-evaluator";

const DEFAULT_HIDDEN_COLUMNS = ["jobTitle", "email", "phone", "lead_type_id", "refered_by", "campaign", "linkedAccount", "opportunityStage", "opportunityBudget", "expectedRevenue", "weightedForecast", "nextStep", "nextStepDue", "daysInPipeline"];
const COLUMN_PREFS_KEY = "mark4.leads.table.v1";
const COLUMN_LABELS: Record<string, string> = {
  lead_status_id: "Stage", lead_source_id: "Source", lead_type_id: "Lead type", client: "Client",
  contact: "Contact", company: "Company / client", jobTitle: "Job title", email: "Email", phone: "Phone",
  refered_by: "Referred by", campaign: "Campaign", assigned_to_user: "Owner", createdAt: "Added",
  linkedAccount: "Linked account", opportunityStage: "Opportunity stage", opportunityBudget: "Opportunity budget",
  expectedRevenue: "Expected revenue", weightedForecast: "Weighted forecast", nextStep: "Next step",
  nextStepDue: "Opportunity next step due", followUpTitle: "Follow-up", followUpDue: "Follow-up date & time",
  followUpStatus: "Follow-up status", daysInPipeline: "Days in pipeline",
};

type ConfigItem = { id: string; name: string };

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  leadSources?: ConfigItem[];
  leadStatuses?: ConfigItem[];
  leadTypes?: ConfigItem[];
  leadFieldSettings: LeadFieldSettings;
  preferencesScope: string;
}

export function LeadDataTable<TData, TValue>({
  data,
  leadSources = [],
  leadStatuses = [],
  leadTypes = [],
  leadFieldSettings,
  preferencesScope,
}: DataTableProps<TData, TValue>) {
  const preferencesKey = `${COLUMN_PREFS_KEY}:${preferencesScope}`;
  const columns = createColumns(leadSources, leadStatuses, leadTypes, leadFieldSettings) as ColumnDef<TData, TValue>[];
  const columnLabels = { ...COLUMN_LABELS, ...Object.fromEntries(leadFieldSettings.customFields.map((field) => [`custom_${field.key}`, field.label])) };
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(Object.fromEntries(DEFAULT_HIDDEN_COLUMNS.map((id) => [id, false])));
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = React.useState(false);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [advancedFilters, setAdvancedFilters] = React.useState<LeadFilterSet>({ groupsLogic: "AND", groups: [] });
  const filteredData = React.useMemo(() => data.filter((row) => leadMatchesAdvancedFilters(row as Record<string, any>, advancedFilters)), [data, advancedFilters]);

  const [hide, setHide] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(preferencesKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { columnVisibility?: VisibilityState; columnOrder?: string[]; advancedFilters?: unknown };
        if (parsed.columnVisibility && typeof parsed.columnVisibility === "object") {
          setColumnVisibility((current) => ({ ...current, ...parsed.columnVisibility }));
        }
        if (Array.isArray(parsed.columnOrder)) setColumnOrder(parsed.columnOrder.filter((id) => typeof id === "string"));
        if (parsed.advancedFilters) setAdvancedFilters(sanitizeLeadFilterSet(parsed.advancedFilters, leadFieldSettings.customFields.filter((field) => !field.hidden).map((field) => field.key)));
      }
    } catch { /* Ignore malformed or blocked browser storage and use defaults. */ }
    setPreferencesLoaded(true);
  }, [leadFieldSettings.customFields, preferencesKey]);

  React.useEffect(() => {
    if (!preferencesLoaded) return;
    try { localStorage.setItem(preferencesKey, JSON.stringify({ columnVisibility, columnOrder, advancedFilters })); }
    catch { /* The table remains usable if browser storage is unavailable. */ }
  }, [columnVisibility, columnOrder, advancedFilters, preferencesLoaded, preferencesKey]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnOrder,
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
    onColumnOrderChange: setColumnOrder,
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
        lead.campaign,
        lead.refered_by,
        lead.preClosureOpportunity?.next_step,
        lead.preClosureOpportunity?.status,
        lead.preClosureOpportunity?.assigned_sales_stage?.name,
        lead.nextFollowUp?.title,
        lead.assigned_accounts?.name,
        ...Object.values(lead.customFields || {}),
      ];
      return values.some((value) => String(value || "").toLowerCase().includes(search));
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div>
          <p className="text-sm font-medium">Lead workspace</p>
          <p className="text-xs text-muted-foreground">Track lead ownership, opportunities, dated follow-ups and client context in one workspace.</p>
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
          <DataTableToolbar table={table} leadStatuses={leadStatuses} leadSources={leadSources} leadTypes={leadTypes} advancedFilters={advancedFilters} onAdvancedFiltersChange={setAdvancedFilters} customFields={leadFieldSettings.customFields} columnLabels={columnLabels} />
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
                      colSpan={table.getVisibleLeafColumns().length}
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
              const visibleCells = row.getVisibleCells();
              const actions = visibleCells.find((cell) => cell.column.id === "actions");
              return (
                <article key={row.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/crm/leads/${lead.id}`} target="_blank" rel="noreferrer" className="block truncate font-semibold hover:text-primary hover:underline">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "New enquiry"}</Link>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{table.getColumn("company")?.getIsVisible() ? lead.company || "Residential client" : lead.assigned_accounts?.name || "Lead record"}</p>
                    </div>
                    {actions ? flexRender(actions.column.columnDef.cell, actions.getContext()) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {table.getColumn("lead_status_id")?.getIsVisible() && <Badge variant={stage ? "secondary" : "outline"}>{stage || "Stage not set"}</Badge>}
                    {table.getColumn("lead_source_id")?.getIsVisible() && source ? <Badge variant="outline">{source}</Badge> : null}
                  </div>
                  <div className="mt-3 grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
                    {visibleCells.filter((cell) => !["client", "actions", "lead_status_id", "lead_source_id", "company"].includes(cell.column.id)).map((cell) => (
                      <div key={cell.id} className="min-w-0 space-y-0.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{columnLabels[cell.column.id] || cell.column.id}</p>
                        <div className="min-w-0 truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                      </div>
                    ))}
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
