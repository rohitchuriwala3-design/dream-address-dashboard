import { getPipelineMetrics } from "../pipeline-metrics";

describe("getPipelineMetrics", () => {
  const now = new Date("2026-11-14T10:00:00.000Z");

  it("counts only active opportunities and calculates gross and weighted values", () => {
    const result = getPipelineMetrics(
      [
        { status: "ACTIVE", sales_stage: "qualified", budget: 100000, expected_revenue: 80000, next_step: "Site visit" },
        { status: "ACTIVE", sales_stage: "unknown", budget: 50000, expected_revenue: 0, next_step: "  " },
        { status: "WON", sales_stage: "qualified", budget: 90000, expected_revenue: 90000 },
      ],
      [{ id: "qualified", probability: 50 }],
      now,
    );

    expect(result).toEqual({
      openCount: 2,
      pipelineValue: 130000,
      weightedValue: 40000,
      missingNextStep: 1,
      overdueCloseDates: 0,
    });
  });

  it("counts past close dates without inventing dates for blanks or invalid data", () => {
    const result = getPipelineMetrics(
      [
        { status: "ACTIVE", close_date: "2026-11-13T10:00:00.000Z" },
        { status: "ACTIVE", close_date: now },
        { status: "ACTIVE", close_date: "invalid" },
        { status: "ACTIVE", close_date: null },
      ],
      [],
      now,
    );

    expect(result.overdueCloseDates).toBe(1);
    expect(result.missingNextStep).toBe(4);
  });

  it("clamps invalid or out-of-range values to safe display metrics", () => {
    const result = getPipelineMetrics(
      [
        { status: "ACTIVE", sales_stage: "a", budget: Number.NaN, expected_revenue: -10 },
        { status: "ACTIVE", sales_stage: "b", budget: 100, expected_revenue: 0 },
      ],
      [{ id: "a", probability: 150 }, { id: "b", probability: -20 }],
      now,
    );

    expect(result.pipelineValue).toBe(100);
    expect(result.weightedValue).toBe(0);
  });
});
