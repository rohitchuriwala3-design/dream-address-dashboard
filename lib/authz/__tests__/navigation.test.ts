import { canSeeNavigationModule } from "../navigation";

describe("permission-based module navigation", () => {
  it("keeps CRM staff inside the CRM modules they were granted", () => {
    const permissions = ["crm.view"] as const;
    expect(canSeeNavigationModule("user", permissions, "crm")).toBe(true);
    expect(canSeeNavigationModule("user", permissions, "finance")).toBe(false);
    expect(canSeeNavigationModule("user", permissions, "reports")).toBe(false);
  });

  it("keeps finance-only staff out of CRM navigation", () => {
    const permissions = ["finance.view"] as const;
    expect(canSeeNavigationModule("user", permissions, "finance")).toBe(true);
    expect(canSeeNavigationModule("user", permissions, "crm")).toBe(false);
    expect(canSeeNavigationModule("user", permissions, "documents")).toBe(false);
  });

  it("does not expose modules without an explicit permission", () => {
    expect(canSeeNavigationModule("user", [], "dashboard")).toBe(false);
    expect(canSeeNavigationModule("user", [], "emails")).toBe(false);
    expect(canSeeNavigationModule("user", ["projects.view"], "documents")).toBe(true);
  });

  it("keeps admin full access and limits partners to their scoped CRM workspace", () => {
    expect(canSeeNavigationModule("admin", [], "finance")).toBe(true);
    expect(canSeeNavigationModule("admin", [], "plugins")).toBe(true);
    expect(canSeeNavigationModule("partner", [], "dashboard")).toBe(true);
    expect(canSeeNavigationModule("partner", [], "crm")).toBe(true);
    expect(canSeeNavigationModule("partner", [], "finance")).toBe(false);
    expect(canSeeNavigationModule("partner", [], "projects")).toBe(false);
    expect(canSeeNavigationModule("partner", [], "reports")).toBe(false);
  });
});
