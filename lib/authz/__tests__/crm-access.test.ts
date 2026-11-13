import { canAccessCrm } from "../crm-access";

describe("CRM route access", () => {
  it("allows administrators and account-scoped partners", () => {
    expect(canAccessCrm("admin")).toBe(true);
    expect(canAccessCrm("partner")).toBe(true);
  });

  it("allows staff with CRM view or manage permission", () => {
    expect(canAccessCrm("user", ["crm.view"])).toBe(true);
    expect(canAccessCrm("manager", ["crm.manage"])).toBe(true);
  });

  it("denies staff without CRM permission", () => {
    expect(canAccessCrm("user", [])).toBe(false);
    expect(canAccessCrm("manager", ["projects.view"])).toBe(false);
  });
});
