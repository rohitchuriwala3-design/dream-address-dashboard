"use client";

import { Fragment, useRef, useState } from "react";
import { Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getLeadFilterLogicError, isCompleteFilterRule } from "./lead-filter-evaluator";

export type LeadFilterField = "stage" | "source" | "type" | "owner" | "name" | "company" | "email" | "phone" | "campaign" | "opportunityStage" | "budget" | "expectedRevenue" | "weightedForecast" | "nextStep" | "nextStepDue" | "daysInPipeline";
export type LeadFilterRule = { id: string; field: LeadFilterField; operator: string; value: string; logicToNext?: "AND" | "OR" };
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
const flattenRules = (groups: LeadFilterGroup[]) => groups.flatMap((group) => group.rules);

interface Props { value: LeadFilterSet; onChange: (value: LeadFilterSet) => void; activeCount: number; choices: Partial<Record<LeadFilterField, { value: string; label: string }[]>>; }

export function AdvancedLeadFilters({ value, onChange, activeCount, choices }: Props) {
  const [open, setOpen] = useState(false);
  const logicInput = useRef<HTMLInputElement>(null);
  const allRules = flattenRules(value.groups);
  const updateGroup = (groupId: string, patch: Partial<LeadFilterGroup>) => onChange({ ...value, expression: undefined, groups: value.groups.map((group) => group.id === groupId ? { ...group, ...patch } : group) });
  const updateRule = (groupId: string, ruleId: string, patch: Partial<LeadFilterRule>) => onChange({ ...value, expression: undefined, groups: value.groups.map((group) => group.id === groupId ? { ...group, rules: group.rules.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) } : group) });
  const removeRule = (groupId: string, ruleId: string) => onChange({ ...value, expression: undefined, groups: value.groups.map((group) => group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group) });

  const ruleNumbers = new Map<string, number>();
  let nextRuleNumber = 0;
  for (const rule of allRules) ruleNumbers.set(rule.id, ++nextRuleNumber);
  const defaultExpression = value.groups.flatMap((group) => {
    const rules = group.rules.filter(isCompleteFilterRule);
    if (!rules.length) return [];
    return [`(${rules.map((rule, index) => `${index ? ` ${rules[index - 1].logicToNext || group.logic} ` : ""}${ruleNumbers.get(rule.id)}`).join("")})`];
  });
  const displayedExpression = value.expression ?? defaultExpression.join(` ${value.groupsLogic} `);
  const expressionError = displayedExpression ? getLeadFilterLogicError(displayedExpression, nextRuleNumber, allRules.map(isCompleteFilterRule)) : null;
  const insertLogicToken = (token: string) => {
    const input = logicInput.current;
    const current = displayedExpression;
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? start;
    const prefix = start > 0 && !/[\s(]$/.test(current.slice(0, start)) ? " " : "";
    const suffix = end < current.length && !/^[\s)]/.test(current.slice(end)) ? " " : "";
    const updated = `${current.slice(0, start)}${prefix}${token}${suffix}${current.slice(end)}`;
    onChange({ ...value, expression: updated });
    requestAnimationFrame(() => {
      const position = start + prefix.length + token.length + suffix.length;
      input?.focus();
      input?.setSelectionRange(position, position);
    });
  };

  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><Button variant="outline" size="sm" className="h-10"><SlidersHorizontal className="mr-2 h-4 w-4" />Filter{activeCount > 0 ? ` · ${activeCount}` : ""}</Button></SheetTrigger>
    <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
      <SheetHeader><SheetTitle>Filter leads</SheetTitle><SheetDescription>Build rules field by field. Join rule rows with AND or OR, then use the logic box for grouped expressions like 1 AND (2 OR 3).</SheetDescription></SheetHeader>
      <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center">
        <div><p className="text-sm font-medium">Filter rules</p><p className="text-xs text-muted-foreground">Add a field, condition and value for each rule.</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onChange({ ...value, expression: undefined, groups: value.groups.length ? value.groups.map((group, index) => index === value.groups.length - 1 ? { ...group, rules: [...group.rules, newRule()] } : group) : [newGroup()] })}><Plus className="mr-2 h-4 w-4" />Add filter</Button><Button variant="ghost" size="sm" onClick={() => onChange({ ...value, expression: undefined, groups: [...value.groups, newGroup()] })}><Plus className="mr-2 h-4 w-4" />Add bracket</Button></div>
      </div>

      <div className="mt-3 space-y-3">
        {value.groups.map((group, groupIndex) => <section key={group.id} className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2"><span className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold text-muted-foreground">( Bracket {groupIndex + 1} )</span><Button variant="ghost" size="sm" disabled={value.groups.length <= 1} onClick={() => onChange({ ...value, expression: undefined, groups: value.groups.filter((item) => item.id !== group.id) })}><Trash2 className="mr-2 h-4 w-4" />Remove bracket</Button></div>
          <div className="space-y-2">
            {group.rules.map((rule, ruleIndex) => {
              const type = fieldType(rule.field);
              const ops = operators(rule.field);
              const ruleNumber = ruleNumbers.get(rule.id);
              return <Fragment key={rule.id}>
                <div className="grid gap-2 rounded-lg border bg-muted/10 p-2 sm:grid-cols-[2rem_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.2fr)_2.25rem] sm:items-center">
                  <span aria-label={`Filter ${ruleNumber}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{ruleNumber}</span>
                  <Select value={rule.field} onValueChange={(field: LeadFilterField) => updateRule(group.id, rule.id, { field, operator: operators(field)[0][0], value: "" })}><SelectTrigger aria-label={`Filter ${ruleNumber} field`}><SelectValue placeholder="Select field" /></SelectTrigger><SelectContent>{FIELDS.map((field) => <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>)}</SelectContent></Select>
                  <Select value={rule.operator} onValueChange={(operator: string) => updateRule(group.id, rule.id, { operator, value: "" })}><SelectTrigger aria-label={`Filter ${ruleNumber} condition`}><SelectValue placeholder="Condition" /></SelectTrigger><SelectContent>{ops.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent></Select>
                  {type === "due" ? <div className="px-2 text-xs text-muted-foreground">Date range comes from the condition</div> : (rule.operator === "empty" || rule.operator === "notEmpty") ? <div className="px-2 text-xs text-muted-foreground">No value needed</div> : type === "choice" && choices[rule.field]?.length ? <Select value={rule.value} onValueChange={(filterValue: string) => updateRule(group.id, rule.id, { value: filterValue })}><SelectTrigger aria-label={`Filter ${ruleNumber} value`}><SelectValue placeholder="Select value" /></SelectTrigger><SelectContent>{choices[rule.field]!.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select> : <Input aria-label={`Filter ${ruleNumber} value`} type={type === "number" ? "number" : "text"} value={rule.value} onChange={(event) => updateRule(group.id, rule.id, { value: event.target.value })} placeholder={type === "number" ? "Enter amount (₹)" : "Enter value"} />}
                  <Button variant="ghost" size="icon" aria-label={`Remove filter ${ruleNumber}`} disabled={allRules.length <= 1} onClick={() => removeRule(group.id, rule.id)}><X className="h-4 w-4" /></Button>
                </div>
                {ruleIndex < group.rules.length - 1 && <div className="flex items-center gap-2 pl-3"><span className="h-3 border-l" /><Select value={rule.logicToNext || group.logic} onValueChange={(logic: "AND" | "OR") => updateRule(group.id, rule.id, { logicToNext: logic })}><SelectTrigger aria-label={`Join filter ${ruleNumber} and next`} className="h-8 w-24 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">AND</SelectItem><SelectItem value="OR">OR</SelectItem></SelectContent></Select><span className="text-xs text-muted-foreground">next filter</span></div>}
              </Fragment>;
            })}
          </div>
          <Button className="mt-3" variant="ghost" size="sm" onClick={() => updateGroup(group.id, { rules: [...group.rules, newRule()] })}><Plus className="mr-2 h-4 w-4" />Add filter head</Button>
          {groupIndex < value.groups.length - 1 && <div className="mt-3 flex items-center gap-2 border-t pt-3"><span className="text-xs text-muted-foreground">Join this group to the next with</span><Select value={value.groupsLogic} onValueChange={(logic: "AND" | "OR") => onChange({ ...value, expression: undefined, groupsLogic: logic })}><SelectTrigger aria-label={`Join rule group ${groupIndex + 1} and next`} className="h-8 w-24 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AND">AND</SelectItem><SelectItem value="OR">OR</SelectItem></SelectContent></Select></div>}
        </section>)}
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-4">
        <div><label htmlFor="lead-filter-logic" className="text-sm font-semibold">Advanced filter logic</label><p className="text-xs text-muted-foreground">Optional. Use rule numbers, AND, OR and parentheses to control precedence.</p></div>
        <Input ref={logicInput} id="lead-filter-logic" aria-label="Advanced filter logic" value={displayedExpression} onChange={(event) => onChange({ ...value, expression: event.target.value })} placeholder="1 AND (2 OR 3)" />
        <div className="flex flex-wrap gap-1.5" aria-label="Insert logic operator">
          {["AND", "OR", "(", ")"].map((token) => <Button key={token} type="button" variant="outline" size="sm" className="h-7 min-w-10 px-2 font-mono" onClick={() => insertLogicToken(token)}>{token}</Button>)}
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => onChange({ ...value, expression: undefined })}>Use rule joins</Button>
        </div>
        <p className={expressionError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{expressionError || "Example: 1 AND (2 OR 3). Leave empty to use the joins above."}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4"><Button variant="ghost" onClick={() => onChange({ groupsLogic: "AND", groups: [] })}>Clear filters</Button><Button className="ml-auto" onClick={() => setOpen(false)}>Done</Button></div>
    </SheetContent>
  </Sheet>;
}
