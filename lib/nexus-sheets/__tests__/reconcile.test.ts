import { reconcileSnapshots } from "../reconcile";

describe("reconcileSnapshots", () => {
  it("reports no changes when both sides match the baseline", () => {
    expect(reconcileSnapshots({ name: "Kitchen" }, { name: "Kitchen" }, { name: "Kitchen" })).toMatchObject({
      action: "NO_CHANGE",
      appChangedFields: [],
      sheetChangedFields: [],
    });
  });

  it("pushes app-only field changes toward the Sheet", () => {
    expect(reconcileSnapshots({ name: "Kitchen" }, { name: "Pantry" }, { name: "Kitchen" })).toMatchObject({
      action: "PUSH_APP",
      appChangedFields: ["name"],
      sheetChangedFields: [],
    });
  });

  it("pulls Sheet-only field changes into the app", () => {
    expect(reconcileSnapshots({ name: "Kitchen" }, { name: "Kitchen" }, { name: "Pantry" })).toMatchObject({
      action: "PULL_SHEET",
      appChangedFields: [],
      sheetChangedFields: ["name"],
    });
  });

  it("merges disjoint app and Sheet changes", () => {
    expect(reconcileSnapshots(
      { name: "Kitchen", city: "Pune" },
      { name: "Pantry", city: "Pune" },
      { name: "Kitchen", city: "Mumbai" },
    )).toMatchObject({
      action: "MERGE",
      merged: { name: "Pantry", city: "Mumbai" },
      conflictingFields: [],
    });
  });

  it("holds divergent edits to the same field as a conflict", () => {
    expect(reconcileSnapshots(
      { name: "Kitchen" },
      { name: "Pantry" },
      { name: "Utility room" },
    )).toMatchObject({
      action: "CONFLICT",
      conflictingFields: ["name"],
    });
  });

  it("does not automatically import explicitly protected fields", () => {
    expect(reconcileSnapshots(
      { amount: 12000 },
      { amount: 12000 },
      { amount: 15000 },
      { protectedFields: ["amount"] },
    )).toMatchObject({
      action: "CONFLICT",
      conflictingFields: ["amount"],
    });
  });

  it("compares dates and nested objects deterministically", () => {
    expect(reconcileSnapshots(
      { date: new Date("2026-11-13T00:00:00.000Z"), address: { city: "Pune", line: "A" } },
      { date: "2026-11-13T00:00:00.000Z", address: { line: "A", city: "Pune" } },
      { date: "2026-11-13T00:00:00.000Z", address: { city: "Pune", line: "A" } },
    )).toMatchObject({ action: "NO_CHANGE" });
  });
});
