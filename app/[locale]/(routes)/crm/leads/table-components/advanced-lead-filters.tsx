"use client";

import { Fragment, useState } from "react";
import { Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getLeadFilterLogicError, isCompleteFilterRule } from "./lead-filter-evaluator";

export type LeadFilterField = "stage" | "source" | "type" | "owner" | "name" | "company" | "email" | "phone" | "campaign" | "opportunityStage" | "budget" | "expectedRevenue" | "weightedForecast" | "nextStep" | "nextStepDue" | "daysInPipeline";
export type LeadFilterRule = { id: string; field: LeadFilterField; operator: string; value: string };
export type LeadFilterGroup = { id: string; logic: "AND" | "OR"; rules: LeadFilterRule[] };
export type LeadFilterSet = { groupsLogic: "AND" | "OR"; groups: LeadFilterGroup[]; expression?: string };

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
  const updateGroup = (groupId: string, patch: Partial<LeadFilterGroup>) => onChange({ ...value, expression: undefined, groups: value.groups.map((group) => group.id === groupId ? { ...group, ...patch } : group) });
  const updateRule = (groupId: string, ruleId: string, patch: Partial<LeadFilterRule>) => onChange({ ...value, groups: value.groups.map((group) => group.id === groupId ? { ...group, rules: group.rules.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) } : group) });
  const removeRule = (groupId: string, ruleId: string) => onChange({ ...value, expression: undefined, groups: value.groups.map((group) => group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group) });
  const ruleNumbers = new Map<string, number>();
  let nextRuleNumber = 0;
  for (const group of value.groups) for (const rule of group.rules) ruleNumbers.set(rule.id, ++nextRuleNumber);
  const defaultExpression = value.groups.flatMap((group) => {
    const rules = group.rules.filter(isCompleteFilterRule);
    if (!rules.length) return [];
    return [`(${rules.map((rule) => String(ruleNumbers.get(rule.id))).join(` ${group.logic} `)})`];
  });
  const displayedExpression = value.expression ?? defaultExpression.join(` ${value.groupsLogic} `);
  const expressionError = displayedExpression ? getLeadFilterLogicError(displayedExpression, nextRuleNumber) : null;

  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="outline" size="sm" className="h-10"><SlidersHorizontal className="mr-2 h-4 w-4" />Filter{activeCount > 0 ? ` · ${activeCount}` : ""}</Button></SheetTrigger>
    <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
      <SheetHeader><SheetTitle>Filter leads</SheetTitle><SheetDescription>Add numbered filter heads, then type the logic between them using AND, OR and parentheses.</SheetDescription></SheetHeader>
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
        <span>Between bracket groups use</span><Select value={value.groupsLogic} onValueChange={(logic: "AND" | "OR") => onChange({ ...value, expression: undefined, groupsLogic: logic })}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">AND</SelectItem><SelectItem value="OR">OR</SelectItem></SelectContent></Select><span>by default</span>
      </div>
      <div className="mt-3 space-y-1 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm"><label htmlFor="lead-filter-logic" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter logic</label><Input id="lead-filter-logic" aria-label="Filter logic" value={displayedExpression} onChange={(event) => onChange({ ...value, expression: event.target.value })} placeholder="1 AND (2 OR 3)" /><p className={expressionError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{expressionError || "Use filter row numbers with AND, OR and parentheses. Example: 1 AND (2 OR 3)."}</p></div>
      <div className="mt-4 space-y-4">
        {value.groups.map((group, groupIndex) => <section key={group.id} className="space-y-3 rounded-xl border border-l-4 border-l-primary/50 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm"><span className="rounded bg-muted px-2 py-1 font-mono font-semibold">( Bracket {groupIndex + 1} )</span><span>Join filters with</span><Select value={group.logic} onValueChange={(logic: "AND" | "OR") => updateGroup(group.id, { logic })}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">AND</SelectItem><SelectItem value="OR">OR</SelectItem></SelectContent></Select></div>
            <Button variant="ghost" size="sm" disabled={value.groups.length <= 1} onClick={() => onChange({ ...value, expression: undefined, groups: value.groups.filter((item) => item.id !== group.id) })}><Trash2 className="mr-2 h-4 w-4" />Remove group</Button>
          </div>
          <div className="space-y-2">
          {group.rules.map((rule, ruleIndex) => {
            const type = fieldType(rule.field);
            const ops = operators(rule.field);
            return <Fragment key={rule.id}><div className="grid gap-2 rounded-lg bg-muted/20 p-2 sm:grid-cols-[auto_1.15fr_1fr_1.2fr_auto] sm:items-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{ruleNumbers.get(rule.id)}</span>
              <Select value={rule.field} onValueChange={(field: LeadFilterField) => updateRule(group.id, rule.id, { field, operator: operators(field)[0][0], value: "" })}><SelectTrigger aria-label="Filter field"><SelectValue /></SelectTrigger><SelectContent>{FIELDS.map((field) => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}</SelectContent></Select>
              <Select value={rule.operator} onValueChange={(operator: string) => updateRule(group.id, rule.id, { operator, value: "" })}><SelectTrigger aria-label="Filter condition"><SelectValue /></SelectTrigger><SelectContent>{ops.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select>
              {type === "due" ? <div className="px-2 text-xs text-muted-foreground">Date range comes from the condition</div> : (rule.operator === "empty" || rule.operator === "notEmpty") ? <div className="text-xs text-muted-foreground">No value needed</div> : type === "choice" && choices[rule.field]?.length ? <Select value={rule.value} onValueChange={(value: string) => updateRule(group.id, rule.id, { value })}><SelectTrigger aria-label="Filter value"><SelectValue placeholder="Choose value" /></SelectTrigger><SelectContent>{choices[rule.field]!.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select> : <Input aria-label="Filter value" type={type === "number" ? "number" : "text"} value={rule.value} onChange={(event) => updateRule(group.id, rule.id, { value: event.target.value })} placeholder={type === "number" ? "Enter amount (₹)" : "Enter value"} />}
              <Button variant="ghost" size="icon" aria-label="Remove rule" disabled={group.rules.length <= 1} onClick={() => removeRule(group.id, rule.id)}><X className="h-4 w-4" /></Button>
            </div>
            {ruleIndex < group.rules.length - 1 && <div className="px-3 py-0.5 text-xs font-semibold text-primary">{group.logic}</div>}
          </Fragment>;
          })}
          </div>
          <div className="text-right font-mono text-sm font-semibold text-muted-foreground">)</div>
          <Button variant="outline" size="sm" onClick={() => updateGroup(group.id, { rules: [...group.rules, newRule()] })}><Plus className="mr-2 h-4 w-4" />Add filter head</Button>
          {groupIndex < value.groups.length - 1 && <div className="py-1 text-center text-xs font-bold text-primary">{value.groupsLogic}</div>}
        </section>)}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onChange({ ...value, expression: undefined, groups: [...value.groups, newGroup()] })}><Plus className="mr-2 h-4 w-4" />Add bracket</Button><Button variant="ghost" onClick={() => onChange({ groupsLogic: "AND", groups: [] })}>Clear filters</Button><Button className="ml-auto" onClick={() => setOpen(false)}>Done</Button></div>
      </div>
    </SheetContent>
  </Sheet>;
}
