"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { Lead } from "../table-data/schema";
import type { LeadFieldSettings } from "@/lib/crm/leads/field-settings-shared";

type ConfigItem = { id: string; name: string };
type LeadRow = Lead & {
  firstName?: string | null;
  lastName: string;
  company?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  campaign?: string | null;
  lead_status_id?: string | null;
  lead_source_id?: string | null;
  lead_type_id?: string | null;
  refered_by?: string | null;
  assigned_to_user?: { name: string | null } | null;
  assigned_accounts?: { name: string } | null;
  preClosureOpportunity?: {
    status?: string | null;
    budget?: number | string | null;
    expected_revenue?: number | string | null;
    next_step?: string | null;
    next_step_due_at?: Date | string | null;
    assigned_sales_stage?: { name: string; probability?: number | null } | null;
  } | null;
};

const dateLabel = (value: Date | string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value))
    : "—";

const moneyLabel = (value: number | string | null | undefined) => value == null
  ? "—"
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

const daysSince = (value?: Date | string | null) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000)) : 0;
};

export const createColumns = (
  leadSources: ConfigItem[],
  leadStatuses: ConfigItem[],
  leadTypes: ConfigItem[],
  leadFieldSettings: LeadFieldSettings,
): ColumnDef<Lead>[] => [
  {
    id: "client",
    accessorFn: (row) => [row.firstName, row.lastName].filter(Boolean).join(" "),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => {
      const lead = row.original as LeadRow;
      const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "New enquiry";
      return (
        <div className="min-w-40">
          <Link href={`/crm/leads/${lead.id}`} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:text-primary hover:underline" data-testid="lead-row-name">{fullName}</Link>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "company",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company / client" />,
    cell: ({ row }) => <span className="text-sm">{(row.original as LeadRow).company || "—"}</span>,
  },
  {
    accessorKey: "jobTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Job title" />,
    cell: ({ row }) => <span className="text-sm">{(row.original as LeadRow).jobTitle || "—"}</span>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span className="max-w-56 truncate text-sm">{(row.original as LeadRow).email || "—"}</span>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-sm">{(row.original as LeadRow).phone || "—"}</span>,
  },
  {
    id: "lead_type_id",
    accessorFn: (row) => leadTypes.find((item) => item.id === (row as LeadRow).lead_type_id)?.name || "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lead type" />,
    cell: ({ row }) => <span className="text-sm">{leadTypes.find((item) => item.id === (row.original as LeadRow).lead_type_id)?.name || "—"}</span>,
    filterFn: (row, _id, value: string[]) => value.includes(String((row.original as LeadRow).lead_type_id || "")),
  },
  {
    accessorKey: "refered_by",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Referred by" />,
    cell: ({ row }) => <span className="text-sm">{(row.original as LeadRow).refered_by || "—"}</span>,
  },
  {
    accessorKey: "campaign",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
    cell: ({ row }) => <span className="text-sm">{(row.original as LeadRow).campaign || "—"}</span>,
  },
  {
    id: "linkedAccount",
    accessorFn: (row) => (row as LeadRow).assigned_accounts?.name || "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Linked account" />,
    cell: ({ row }) => <span className="text-sm">{(row.original as LeadRow).assigned_accounts?.name || "—"}</span>,
  },
  {
    id: "opportunityStage",
    accessorFn: (row) => (row as LeadRow).preClosureOpportunity?.assigned_sales_stage?.name || (row as LeadRow).preClosureOpportunity?.status || "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opportunity stage" />,
    cell: ({ row }) => <Badge variant="outline">{(row.original as LeadRow).preClosureOpportunity?.assigned_sales_stage?.name || (row.original as LeadRow).preClosureOpportunity?.status || "No opportunity"}</Badge>,
  },
  {
    id: "opportunityBudget",
    accessorFn: (row) => Number((row as LeadRow).preClosureOpportunity?.budget ?? 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opportunity budget" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-sm">{moneyLabel((row.original as LeadRow).preClosureOpportunity?.budget)}</span>,
  },
  {
    id: "expectedRevenue",
    accessorFn: (row) => Number((row as LeadRow).preClosureOpportunity?.expected_revenue ?? 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Expected revenue" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-sm">{moneyLabel((row.original as LeadRow).preClosureOpportunity?.expected_revenue)}</span>,
  },
  {
    id: "weightedForecast",
    accessorFn: (row) => {
      const opportunity = (row as LeadRow).preClosureOpportunity;
      return Number(opportunity?.expected_revenue ?? 0) * Number(opportunity?.assigned_sales_stage?.probability ?? 0) / 100;
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Weighted forecast" />,
    cell: ({ row }) => {
      const opportunity = (row.original as LeadRow).preClosureOpportunity;
      const weighted = Number(opportunity?.expected_revenue ?? 0) * Number(opportunity?.assigned_sales_stage?.probability ?? 0) / 100;
      return <span className="whitespace-nowrap text-sm">{opportunity ? moneyLabel(weighted) : "—"}</span>;
    },
  },
  {
    id: "nextStep",
    accessorFn: (row) => (row as LeadRow).preClosureOpportunity?.next_step || "",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Next step" />,
    cell: ({ row }) => <span className="max-w-56 truncate text-sm">{(row.original as LeadRow).preClosureOpportunity?.next_step || "—"}</span>,
  },
  {
    id: "nextStepDue",
    accessorFn: (row) => (row as LeadRow).preClosureOpportunity?.next_step_due_at ? new Date((row as LeadRow).preClosureOpportunity!.next_step_due_at!).getTime() : 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Next step due" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-sm">{dateLabel((row.original as LeadRow).preClosureOpportunity?.next_step_due_at)}</span>,
  },
  {
    id: "daysInPipeline",
    accessorFn: (row) => daysSince(row.createdAt),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Days in pipeline" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-sm">{daysSince(row.original.createdAt)} days</span>,
  },
  {
    accessorKey: "lead_status_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
    cell: ({ row }) => {
      const lead = row.original as LeadRow;
      const status = leadStatuses.find((item) => item.id === lead.lead_status_id)?.name;
      return <Badge variant={status ? "secondary" : "outline"}>{status || "Stage not set"}</Badge>;
    },
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id) || "")),
  },
  {
    accessorKey: "lead_source_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => {
      const lead = row.original as LeadRow;
      return <span className="text-sm">{lead.refered_by ? `Referral · ${lead.refered_by}` : leadSources.find((item) => item.id === lead.lead_source_id)?.name || "Not recorded"}</span>;
    },
    filterFn: (row, id, value: string[]) => value.includes(String(row.getValue(id) || "")),
  },
  {
    id: "contact",
    accessorFn: (row) => `${(row as LeadRow).phone || ""} ${(row as LeadRow).email || ""}`,
    header: "Contact",
    cell: ({ row }) => {
      const lead = row.original as LeadRow;
      return <div className="min-w-40 space-y-1 text-sm"><p>{lead.phone || "No phone"}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{lead.email || "No email"}</p></div>;
    },
  },
  {
    accessorKey: "assigned_to_user",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    cell: ({ row }) => <span className="text-sm">{(row.original as LeadRow).assigned_to_user?.name || "Unassigned"}</span>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Added" />,
    cell: ({ row }) => <span className="whitespace-nowrap text-sm text-muted-foreground">{dateLabel(row.original.createdAt)}</span>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        leadSources={leadSources}
        leadStatuses={leadStatuses}
        leadTypes={leadTypes}
        leadFieldSettings={leadFieldSettings}
      />
    ),
    enableHiding: false,
  },
];
