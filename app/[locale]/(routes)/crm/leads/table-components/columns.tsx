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
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  lead_status_id?: string | null;
  lead_source_id?: string | null;
  refered_by?: string | null;
  assigned_to_user?: { name: string | null } | null;
};

const dateLabel = (value: Date | string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value))
    : "—";

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
          <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground">{lead.company || "Residential client"}</p>
        </div>
      );
    },
    enableHiding: false,
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
  },
];
