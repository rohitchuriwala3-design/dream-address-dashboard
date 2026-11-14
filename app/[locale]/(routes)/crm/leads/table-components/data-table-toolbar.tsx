"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Search } from "lucide-react";
import { AdvancedLeadFilters, type LeadFilterSet } from "./advanced-lead-filters";
import { countActiveLeadFilters } from "./lead-filter-evaluator";
import type { LeadCustomField } from "@/lib/crm/leads/field-settings-shared";

type ConfigItem = { id: string; name: string };

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  leadStatuses: ConfigItem[];
  leadSources: ConfigItem[];
  leadTypes: ConfigItem[];
  advancedFilters: LeadFilterSet;
  onAdvancedFiltersChange: (filters: LeadFilterSet) => void;
  customFields: LeadCustomField[];
  columnLabels: Record<string, string>;
}

export function DataTableToolbar<TData>({
  table,
  leadStatuses,
  leadSources,
  leadTypes,
  advancedFilters,
  onAdvancedFiltersChange,
  customFields,
  columnLabels,
}: DataTableToolbarProps<TData>) {
  const activeAdvancedFilters = countActiveLeadFilters(advancedFilters);
  const isFiltered = table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter) || activeAdvancedFilters > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label="Search leads"
          placeholder="Search name, company, phone or email"
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-10 w-full pl-9"
        />
        </div>
        {table.getColumn("lead_status_id") && (
          <DataTableFacetedFilter
            column={table.getColumn("lead_status_id")}
            title="Stage"
            options={leadStatuses.map((item) => ({ label: item.name, value: item.id }))}
          />
        )}
        {table.getColumn("lead_source_id") && leadSources.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("lead_source_id")}
            title="Source"
            options={leadSources.map((item) => ({ label: item.name, value: item.id }))}
          />
        )}
        {table.getColumn("lead_type_id") && leadTypes.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("lead_type_id")}
            title="Lead type"
            options={leadTypes.map((item) => ({ label: item.name, value: item.id }))}
          />
        )}
        <AdvancedLeadFilters
          value={advancedFilters}
          onChange={onAdvancedFiltersChange}
          activeCount={activeAdvancedFilters}
          choices={{
            stage: leadStatuses.map((item) => ({ value: item.id, label: item.name })),
            source: leadSources.map((item) => ({ value: item.id, label: item.name })),
            type: leadTypes.map((item) => ({ value: item.id, label: item.name })),
            followUpStatus: [{ value: "overdue", label: "Overdue" }, { value: "upcoming", label: "Upcoming" }, { value: "none", label: "No follow-up" }],
            ...Object.fromEntries(customFields.filter((field) => field.type === "select" || field.type === "checkbox").map((field) => [
              `custom_${field.key}`,
              field.type === "checkbox" ? [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] : (field.options || []).map((value) => ({ value, label: value })),
            ])),
          }}
          customFields={customFields}
        />
        {/*        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )} */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => { table.resetColumnFilters(); table.setGlobalFilter(""); onAdvancedFiltersChange({ groupsLogic: "AND", groups: [] }); }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="sm:ml-auto"><DataTableViewOptions table={table} labels={columnLabels} /></div>
    </div>
  );
}
