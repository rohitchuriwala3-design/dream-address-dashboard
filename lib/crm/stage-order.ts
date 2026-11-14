export function withEffectiveStageOrder<T extends { order?: number | null }>(
  stages: T[]
): Array<T & { order: number }> {
  let nextOrder = stages.reduce((max, stage) => Math.max(max, stage.order ?? -10), -10);
  return stages.map((stage) => ({
    ...stage,
    order: stage.order ?? (nextOrder += 10),
  }));
}
