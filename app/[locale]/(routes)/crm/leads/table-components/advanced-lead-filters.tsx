"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type LeadFilterField = "stage" | "source" | "type" | "owner" | "name" | "company" | "email" | "phone" | "campaign" | "opportunityStage" | "budget" | "expectedRevenue" | "weightedForecast" | "nextStep" | "nextStepDue" | "daysInPipeline";
export type LeadFilterRule = { id: string; field: LeadFilterField; operator: string; value: string };
export type LeadFilterGroup = { id: string; logic: "AND" | "OR"; rules: LeadFilterRule[] };
export type LeadFilterSet = { groupsLogic: "AND" | "OR"; groups: LeadFilterGroup[] };

const FIELDS: { id: LeadFilterField; label: string; type: "text" | "number" | "choice" | "due" }[] = [
  { id: "stage", label: "Lead stage", type: "choice" }, { id: "source", label: "Lead source", type: "choice" },
  { id: "type", label: "Lead type", type: "choice" }, { id: "owner", label: "Lead owner", type: "text" },
  { id: "name", label: "Client name", type: "text" }, { id: "company", label: "Company / client", type: "text" },
  { id: "email", label: "Email", type: "text" }, { id: "phone", label: "Phone", type: "text" },
  { id: "campaign", label: "Campaign", type: "text" }, { id: "opportunityStage", label: "Opportunity stage", type: "text" },
  { id: "budget", label: "Opportunity budget (₹)", type: "number" }, { id: "expectedRevenue", label: "Expected revenue (₹)", type: "number" },
  { id: "weightedForecast", label: "Weighted forecast (₹)", type: "number" }, { id: "nextStep", label: "Next step", type: "text" },
  { id: "nextStepDue", label: "Next step due", type: "due" }, { id: "daysInPipeline", label: "Days in pipeline", type: "number" },
];

const fieldType = (field: LeadFilterField) => FIELDS.find((item) => item.id === field)?.type || "text";
const operators = (field: LeadFilterField) => {
  const type = fieldType(field);
  if (type === "number") return [["eq", "is equal to"], ["gt", "is greater than"], ["gte", "is at least"], ["lt", "is less than"], ["lte", "is at most"]];
  if (type === "due") return [["overdue", "is overdue"], ["today", "is due today"], ["next7", "is due in the next 7 days"], ["later", "is due later"], ["noDate", "has no due date"]];
  if (type === "choice") return [["eq", "is"], ["neq", "is not"], ["empty", "is empty"], ["notEmpty", "is not empty"]];
  return [["contains", "contains"], ["eq", "is exactly"], ["neq", "is not"], ["empty", "is empty"], ["notEmpty", "is not empty"]];
};

const newRule = (): LeadFilterRule => ({ id: crypto.randomUUID(), field: "stage", operator: "eq", value: "" });
const newGroup = (): LeadFilterGroup => ({ id: crypto.randomUUID(), logic: "AND", rules: [newRule()] });

interface Props { value: LeadFilterSet; onChange: (value: LeadFilterSet) => void; activeCount: number; choices: Partial<Record<LeadFilterField, { value: string; label: string }[]>>; }

export function AdvancedLeadFilters({ value, onChange, activeCount, choices }: Props) {
  const [open, setOpen] = useState(false);
  const updateGroup = (groupId: string, patch: Partial<LeadFilterGroup>) => onChange({ ...value, groups: value.groups.map((group) => group.id === groupId ? { ...group, ...patch } : group) });
  const updateRule = (groupId: string, ruleId: string, patch: Partial<LeadFilterRule>) => onChange({ ...value, groups: value.groups.map((group) => group.id === groupId ? { ...group, rules: group.rules.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) } : group) });
  const removeRule = (groupId: string, ruleId: string) => onChange({ ...value, groups: value.groups.map((group) => group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group) });

  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="outline" size="sm" className="h-10"><SlidersHorizontal className="mr-2 h-4 w-4" />Filter{activeCount > 0 ? ` · ${activeCount}` : ""}</Button></SheetTrigger>
    <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
      <SheetHeader><SheetTitle>Filter leads</SheetTitle><SheetDescription>Build bracketed rule groups. Choose ALL/ANY inside each group, then combine the groups with AND/OR logic.</SheetDescription></SheetHeader>
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
        <span>Match</span><Select value={value.groupsLogic} onValueChange={(logic: "AND" | "OR") => onChange({ ...value, groupsLogic: logic })}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">ALL groups</SelectItem><SelectItem value="OR">ANY group</SelectItem></SelectContent></Select><span>of these groups</span>
      </div>
      <div className="mt-4 space-y-4">
        {value.groups.map((group, groupIndex) => <section key={group.id} className="space-y-3 rounded-xl border p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">( Group {groupIndex + 1} )</span><span>Match</span><Select value={group.logic} onValueChange={(logic: "AND" | "OR") => updateGroup(group.id, { logic })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">ALL rules</SelectItem><SelectItem value="OR">ANY rule</SelectItem></SelectContent></Select><span>in this bracket</span></div>
            <Button variant="ghost" size="sm" disabled={value.groups.length <= 1} onClick={() => onChange({ ...value, groups: value.groups.filter((item) => item.id !== group.id) })}><Trash2 className="mr-2 h-4 w-4" />Remove group</Button>
          </div>
          <div className="space-y-2">
          {group.rules.map((rule) => {
            const type = fieldType(rule.field);
            const ops = operators(rule.field);
            return <div key={rule.id} className="grid gap-2 rounded-lg bg-muted/20 p-2 sm:grid-cols-[1.15fr_1fr_1.2fr_auto] sm:items-center">
              <Select value={rule.field} onValueChange={(field: LeadFilterField) => updateRule(group.id, rule.id, { field, operator: operators(field)[0][0], value: "" })}><SelectTrigger aria-label="Filter field"><SelectValue /></SelectTrigger><SelectContent>{FIELDS.map((field) => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}</SelectContent></Select>
              <Select value={rule.operator} onValueChange={(operator: string) => updateRule(group.id, rule.id, { operator, value: "" })}><SelectTrigger aria-label="Filter condition"><SelectValue /></SelectTrigger><SelectContent>{ops.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select>
              {type === "due" ? <div className="px-2 text-xs text-muted-foreground">Date range comes from the condition</div> : (rule.operator === "empty" || rule.operator === "notEmpty") ? <div className="text-xs text-muted-foreground">No value needed</div> : type === "choice" && choices[rule.field]?.length ? <Select value={rule.value} onValueChange={(value: string) => updateRule(group.id, rule.id, { value })}><SelectTrigger aria-label="Filter value"><SelectValue placeholder="Choose value" /></SelectTrigger><SelectContent>{choices[rule.field]!.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select> : <Input aria-label="Filter value" type={type === "number" ? "number" : "text"} value={rule.value} onChange={(event) => updateRule(group.id, rule.id, { value: event.target.value })} placeholder={type === "number" ? "Enter amount (₹)" : "Enter value"} />}
              <Button variant="ghost" size="icon" aria-label="Remove rule" disabled={group.rules.length <= 1} onClick={() => removeRule(group.id, rule.id)}><X className="h-4 w-4" /></Button>
            </div>;
          })}
          </div>
          <Button variant="outline" size="sm" onClick={() => updateGroup(group.id, { rules: [...group.rules, newRule()] })}><Plus className="mr-2 h-4 w-4" />Add condition</Button>
          {groupIndex < value.groups.length - 1 && <div className="py-1 text-center text-xs font-semibold text-muted-foreground">{value.groupsLogic}</div>}
        </section>)}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onChange({ ...value, groups: [...value.groups, newGroup()] })}><Plus className="mr-2 h-4 w-4" />Add filter group</Button><Button variant="ghost" onClick={() => onChange({ groupsLogic: "AND", groups: [] })}>Clear filters</Button><Button className="ml-auto" onClick={() => setOpen(false)}>Done</Button></div>
      </div>
    </SheetContent>
  </Sheet>;
}
