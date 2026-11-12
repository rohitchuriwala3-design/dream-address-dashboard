export const STUDIO_PROJECT_STATUSES = [
  "PLANNING", "DESIGN", "PROCUREMENT", "EXECUTION", "HANDOVER", "COMPLETED", "ON_HOLD", "CANCELLED",
] as const;

export type StudioProjectStatus = (typeof STUDIO_PROJECT_STATUSES)[number];
