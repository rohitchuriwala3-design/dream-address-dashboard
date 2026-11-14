import type { LeadFilterField, LeadFilterGroup, LeadFilterRule, LeadFilterSet } from "./advanced-lead-filters";

type LeadLike = Record<string, any>;
const text = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("en-IN");
const daysInPipeline = (value: unknown) => {
  if (!value) return null;
  const time = new Date(value as string | number | Date).getTime();
  return Number.isFinite(time) ? Math.max(0, Math.floor((Date.now() - time) / 86_400_000)) : null;
};

function fieldValue(lead: LeadLike, field: LeadFilterField): unknown {
  const opportunity = lead.preClosureOpportunity;
  switch (field) {
    case "stage": return lead.lead_status_id;
    case "source": return lead.lead_source_id;
    case "type": return lead.lead_type_id;
    case "owner": return lead.assigned_to_user?.name;
    case "name": return [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    case "company": return lead.company;
    case "email": return lead.email;
    case "phone": return lead.phone;
    case "campaign": return lead.campaign;
    case "opportunityStage": return opportunity?.assigned_sales_stage?.name || opportunity?.status;
    case "budget": return opportunity?.budget;
    case "expectedRevenue": return opportunity?.expected_revenue;
    case "weightedForecast": return opportunity ? Number(opportunity.expected_revenue ?? 0) * Number(opportunity.assigned_sales_stage?.probability ?? 0) / 100 : null;
    case "nextStep": return opportunity?.next_step;
    case "nextStepDue": return opportunity?.next_step_due_at;
    case "daysInPipeline": return daysInPipeline(lead.createdAt);
  }
}

function dueBucket(value: unknown): string {
  if (!value) return "noDate";
  const date = new Date(value as string | number | Date);
  if (!Number.isFinite(date.getTime())) return "noDate";
  date.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.floor((date.getTime() - today.getTime()) / 86_400_000);
  return days < 0 ? "overdue" : days === 0 ? "today" : days <= 7 ? "next7" : "later";
}

export function isCompleteFilterRule(rule: LeadFilterRule): boolean {
  return ["empty", "notEmpty", "overdue", "today", "next7", "later", "noDate"].includes(rule.operator) || rule.value.trim().length > 0;
}

function matches(lead: LeadLike, rule: LeadFilterRule): boolean {
  if (!isCompleteFilterRule(rule)) return true;
  const value = fieldValue(lead, rule.field);
  if (["empty", "notEmpty"].includes(rule.operator)) return rule.operator === "empty" ? !text(value) : Boolean(text(value));
  if (rule.field === "nextStepDue") return dueBucket(value) === rule.operator;
  if (["budget", "expectedRevenue", "weightedForecast", "daysInPipeline"].includes(rule.field)) {
    if (value === null || value === undefined || value === "") return false;
    const actual = Number(value), expected = Number(rule.value);
    if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
    if (rule.operator === "eq") return actual === expected;
    if (rule.operator === "gt") return actual > expected;
    if (rule.operator === "gte") return actual >= expected;
    if (rule.operator === "lt") return actual < expected;
    if (rule.operator === "lte") return actual <= expected;
    return false;
  }
  if (["eq", "neq", "contains"].includes(rule.operator)) {
    const actual = text(value), expected = text(rule.value);
    if (rule.operator === "contains") return actual.includes(expected);
    return rule.operator === "eq" ? actual === expected : actual !== expected;
  }
  return false;
}

function matchesGroup(lead: LeadLike, group: LeadFilterGroup): boolean {
  const active = group.rules.filter(isCompleteFilterRule);
  if (!active.length) return true;
  return group.logic === "AND" ? active.every((rule) => matches(lead, rule)) : active.some((rule) => matches(lead, rule));
}

export function countActiveLeadFilters(filters: LeadFilterSet): number {
  return filters.groups.reduce((total, group) => total + group.rules.filter(isCompleteFilterRule).length, 0);
}

const validFields: LeadFilterField[] = ["stage", "source", "type", "owner", "name", "company", "email", "phone", "campaign", "opportunityStage", "budget", "expectedRevenue", "weightedForecast", "nextStep", "nextStepDue", "daysInPipeline"];
const validOperators = ["eq", "neq", "contains", "empty", "notEmpty", "gt", "gte", "lt", "lte", "overdue", "today", "next7", "later", "noDate"];

export function sanitizeLeadFilterSet(input: unknown): LeadFilterSet {
  const fallback: LeadFilterSet = { groupsLogic: "AND", groups: [] };
  if (!input || typeof input !== "object") return fallback;
  const candidate = input as Partial<LeadFilterSet>;
  if (!Array.isArray(candidate.groups)) return fallback;
  const groups = candidate.groups.slice(0, 8).flatMap((rawGroup) => {
    if (!rawGroup || typeof rawGroup !== "object") return [];
    const group = rawGroup as Partial<LeadFilterGroup>;
    if (!Array.isArray(group.rules)) return [];
    const rules = group.rules.slice(0, 10).flatMap((rawRule) => {
      if (!rawRule || typeof rawRule !== "object") return [];
      const rule = rawRule as Partial<LeadFilterRule>;
      if (typeof rule.id !== "string" || !validFields.includes(rule.field as LeadFilterField) || !validOperators.includes(String(rule.operator))) return [];
      return [{ id: rule.id.slice(0, 80), field: rule.field as LeadFilterField, operator: String(rule.operator), value: typeof rule.value === "string" ? rule.value.slice(0, 500) : "" }];
    });
    if (typeof group.id !== "string") return [];
    return [{ id: group.id.slice(0, 80), logic: group.logic === "OR" ? "OR" as const : "AND" as const, rules }];
  });
  return { groupsLogic: candidate.groupsLogic === "OR" ? "OR" : "AND", groups };
}

export function leadMatchesAdvancedFilters(lead: LeadLike, filters: LeadFilterSet): boolean {
  const active = filters.groups.filter((group) => group.rules.some(isCompleteFilterRule));
  if (!active.length) return true;
  return filters.groupsLogic === "AND" ? active.every((group) => matchesGroup(lead, group)) : active.some((group) => matchesGroup(lead, group));
}
