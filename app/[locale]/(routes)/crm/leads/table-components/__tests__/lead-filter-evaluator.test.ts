import { countActiveLeadFilters, getLeadFilterLogicError, leadMatchesAdvancedFilters, sanitizeLeadFilterSet } from "../lead-filter-evaluator";
import type { LeadFilterSet } from "../advanced-lead-filters";

const makeRule = (id: string, field: "stage" | "company" | "budget", operator: string, value: string, logicToNext?: "AND" | "OR") => ({ id, field, operator, value, logicToNext });
const sampleLead = { lead_status_id: "qualified", company: "Rainbow Residence", preClosureOpportunity: { budget: 500_000 } };

describe("lead filter evaluator", () => {
  it("evaluates manually grouped AND/OR expressions", () => {
    const filters: LeadFilterSet = {
      groupsLogic: "AND",
      groups: [{ id: "g1", logic: "AND", rules: [
        makeRule("r1", "stage", "eq", "qualified"),
        makeRule("r2", "company", "contains", "villa"),
        makeRule("r3", "budget", "gte", "400000"),
      ] }],
      expression: "1 AND (2 OR 3)",
    };

    expect(leadMatchesAdvancedFilters(sampleLead, filters)).toBe(true);
    expect(leadMatchesAdvancedFilters({ ...sampleLead, lead_status_id: "new" }, filters)).toBe(false);
  });

  it("applies per-head joins with AND precedence over OR", () => {
    const filters: LeadFilterSet = {
      groupsLogic: "AND",
      groups: [{ id: "g1", logic: "AND", rules: [
        makeRule("r1", "stage", "eq", "new", "OR"),
        makeRule("r2", "company", "contains", "rainbow", "AND"),
        makeRule("r3", "budget", "gte", "600000"),
      ] }],
    };

    expect(leadMatchesAdvancedFilters({ ...sampleLead, lead_status_id: "new" }, filters)).toBe(true); // (stage is new) OR (company matches AND budget threshold)
    expect(leadMatchesAdvancedFilters({ ...sampleLead, lead_status_id: "qualified", preClosureOpportunity: { budget: 10 } }, filters)).toBe(false);
  });

  it("rejects malformed, unknown, and incomplete referenced rules", () => {
    expect(getLeadFilterLogicError("1 AND (2 OR 3)", 3)).toBeNull();
    expect(getLeadFilterLogicError("1 AND (2 OR", 2)).toMatch(/closing parenthesis|Expected/i);
    expect(getLeadFilterLogicError("1 OR 4", 3)).toMatch(/does not exist/i);
    expect(getLeadFilterLogicError("1 OR 2", 2, [true, false])).toMatch(/Filter 2 is incomplete/i);
  });

  it("sanitizes stored joins and counts only complete rules", () => {
    const filters = sanitizeLeadFilterSet({
      groupsLogic: "OR",
      groups: [{ id: "g1", logic: "AND", rules: [
        makeRule("r1", "stage", "eq", "qualified", "OR"),
        makeRule("r2", "company", "contains", ""),
      ] }],
    });
    expect(filters.groups[0].rules[0].logicToNext).toBe("OR");
    expect(countActiveLeadFilters(filters)).toBe(1);
  });
});
