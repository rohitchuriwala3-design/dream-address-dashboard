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

  it("filters Leads by configured custom text and number fields only", () => {
    const filters = sanitizeLeadFilterSet({ groupsLogic: "AND", groups: [{ id: "g", logic: "AND", rules: [
      { id: "r1", field: "custom_locality", operator: "contains", value: "baner" },
      { id: "r2", field: "custom_site_visits", operator: "gte", value: "2" },
      { id: "r3", field: "custom_unconfigured", operator: "eq", value: "anything" },
    ] }] }, ["locality", "site_visits"]);
    expect(filters.groups[0].rules).toHaveLength(2);
    expect(leadMatchesAdvancedFilters({ customFields: { locality: "Baner, Pune", site_visits: 3 } }, filters)).toBe(true);
    expect(leadMatchesAdvancedFilters({ customFields: { locality: "Kothrud", site_visits: 3 } }, filters)).toBe(false);
  });

  it("filters leads by dated activity follow-ups and overdue state", () => {
    const filters: LeadFilterSet = { groupsLogic: "AND", groups: [{ id: "g", logic: "AND", rules: [
      { id: "r1", field: "followUpStatus", operator: "eq", value: "overdue" },
      { id: "r2", field: "followUpTitle", operator: "contains", value: "call" },
      { id: "r3", field: "followUpDue", operator: "overdue", value: "" },
    ] }] };
    const lead = { followUpOverdueCount: 1, nextFollowUp: { title: "Call client back", date: "2020-01-01T12:00:00.000Z" } };
    expect(leadMatchesAdvancedFilters(lead, filters)).toBe(true);
    expect(leadMatchesAdvancedFilters({ followUpOverdueCount: 0, nextFollowUp: { title: "Call client back", date: "2099-01-01T12:00:00.000Z" } }, filters)).toBe(false);
  });
});
