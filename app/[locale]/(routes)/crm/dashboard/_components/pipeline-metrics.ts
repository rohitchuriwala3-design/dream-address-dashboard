type OpportunityForMetrics = {
  status?: string | null;
  sales_stage?: string | null;
  expected_revenue?: unknown;
  budget?: unknown;
  next_step?: string | null;
  close_date?: Date | string | null;
};

type StageForMetrics = { id: string; probability?: unknown };

export function getPipelineMetrics(
  opportunities: OpportunityForMetrics[],
  stages: StageForMetrics[],
  now = new Date(),
) {
  const active = opportunities.filter((opportunity) => opportunity.status === "ACTIVE");
  const probabilities = new Map(stages.map((stage) => [stage.id, Number(stage.probability) || 0]));
  let pipelineValue = 0;
  let weightedValue = 0;
  let missingNextStep = 0;
  let overdueCloseDates = 0;

  for (const opportunity of active) {
    const expected = Number(opportunity.expected_revenue);
    const budget = Number(opportunity.budget);
    const value = Number.isFinite(expected) && expected > 0
      ? expected
      : Number.isFinite(budget) && budget > 0
        ? budget
        : 0;
    const probability = Math.max(0, Math.min(100, probabilities.get(opportunity.sales_stage ?? "") ?? 0));
    pipelineValue += value;
    weightedValue += value * probability / 100;

    if (!opportunity.next_step?.trim()) missingNextStep += 1;
    if (opportunity.close_date) {
      const closeDate = new Date(opportunity.close_date);
      if (!Number.isNaN(closeDate.getTime()) && closeDate < now) overdueCloseDates += 1;
    }
  }

  return { openCount: active.length, pipelineValue, weightedValue, missingNextStep, overdueCloseDates };
}
