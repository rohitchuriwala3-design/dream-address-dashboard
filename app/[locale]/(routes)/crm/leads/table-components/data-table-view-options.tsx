"use client";

import { useState } from "react";
import { Table } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Columns3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

const COLUMN_LABELS: Record<string, string> = {
  lead_status_id: "Lead stage", lead_source_id: "Lead source", lead_type_id: "Lead type",
  client: "Client", contact: "Contact details", company: "Company / client", jobTitle: "Job title",
  email: "Email", phone: "Phone", refered_by: "Referred by", campaign: "Campaign",
  assigned_to_user: "Lead owner", createdAt: "Date added", linkedAccount: "Linked account",
  opportunityStage: "Opportunity stage", opportunityBudget: "Opportunity budget",
  expectedRevenue: "Expected revenue", weightedForecast: "Weighted forecast",
  nextStep: "Next step", nextStepDue: "Next step due", daysInPipeline: "Days in pipeline",
};

interface DataTableViewOptionsProps<TData> { table: Table<TData>; labels?: Record<string, string>; }

export function DataTableViewOptions<TData>({ table, labels = {} }: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = useState(false);
  const pinned = new Set(["client", "actions"]);
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide() && !pinned.has(column.id));
  const movableIds = columns.map((column) => column.id);
  const savedOrder = table.getState().columnOrder.filter((id) => movableIds.includes(id));
  const order = [...savedOrder, ...movableIds.filter((id) => !savedOrder.includes(id))];

  function move(id: string, direction: -1 | 1) {
    const index = order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    table.setColumnOrder(["client", ...next, "actions"]);
  }

  function reset() {
    for (const column of columns) column.toggleVisibility(!["jobTitle", "email", "phone", "lead_type_id", "refered_by", "campaign", "linkedAccount", "opportunityStage", "opportunityBudget", "expectedRevenue", "weightedForecast", "nextStep", "nextStepDue", "daysInPipeline"].includes(column.id));
    table.setColumnOrder([]);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          <Columns3 className="mr-2 h-4 w-4" aria-hidden="true" /> Customize columns
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Customize Lead table</SheetTitle>
          <SheetDescription>Choose the information to show and arrange columns for your workflow. Your choices are saved in this browser.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 flex justify-end">
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Reset defaults</Button>
        </div>
        <div className="mt-3 space-y-2">
          {order.map((id, index) => {
            const column = table.getColumn(id);
            if (!column || !column.getCanHide()) return null;
            return <div key={id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-medium">
                <Checkbox checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(Boolean(value))} />
                <span className="truncate">{labels[id] || COLUMN_LABELS[id] || id}</span>
              </label>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${labels[id] || COLUMN_LABELS[id] || id} earlier`} disabled={index === 0} onClick={() => move(id, -1)}><ChevronUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${labels[id] || COLUMN_LABELS[id] || id} later`} disabled={index === order.length - 1} onClick={() => move(id, 1)}><ChevronDown className="h-4 w-4" /></Button>
              </div>
            </div>;
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
