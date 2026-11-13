export type SheetSyncAction = "NO_CHANGE" | "PUSH_APP" | "PULL_SHEET" | "MERGE" | "CONFLICT";

export interface ReconcileSnapshotsOptions {
  /** Fields whose Sheet-side edits must be reviewed before changing application records. */
  protectedFields?: readonly string[];
}

export interface SnapshotReconciliation<T extends Record<string, unknown>> {
  action: SheetSyncAction;
  appChangedFields: string[];
  sheetChangedFields: string[];
  conflictingFields: string[];
  /** Conflict-free, field-level merge. Conflicting and protected Sheet values remain at baseline. */
  merged: Partial<T>;
}

function normalize(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  }
  return value;
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

/**
 * Reconcile one previously synced record without choosing a winner for divergent edits.
 * App-only edits are pushed, Sheet-only edits are pulled, disjoint edits merge, and
 * same-field divergence (or protected Sheet fields) is held for administrator review.
 */
export function reconcileSnapshots<T extends Record<string, unknown>>(
  baseline: T,
  app: T,
  sheet: T,
  options: ReconcileSnapshotsOptions = {},
): SnapshotReconciliation<T> {
  const fields = Array.from(new Set([
    ...Object.keys(baseline),
    ...Object.keys(app),
    ...Object.keys(sheet),
  ])).sort();
  const protectedFields = new Set(options.protectedFields ?? []);
  const appChangedFields: string[] = [];
  const sheetChangedFields: string[] = [];
  const conflictingFields: string[] = [];
  const merged = { ...baseline } as Partial<T>;
  let unresolvedAppChanges = 0;
  let unresolvedSheetChanges = 0;

  for (const field of fields) {
    const baselineValue = baseline[field];
    const appValue = app[field];
    const sheetValue = sheet[field];
    const appChanged = !sameValue(baselineValue, appValue);
    const sheetChanged = !sameValue(baselineValue, sheetValue);

    if (appChanged) appChangedFields.push(field);
    if (sheetChanged) sheetChangedFields.push(field);

    if (!appChanged && !sheetChanged) {
      merged[field as keyof T] = baselineValue as T[keyof T];
      continue;
    }

    if (appChanged && sheetChanged) {
      if (sameValue(appValue, sheetValue)) {
        merged[field as keyof T] = appValue as T[keyof T];
      } else {
        conflictingFields.push(field);
        merged[field as keyof T] = baselineValue as T[keyof T];
      }
      continue;
    }

    if (appChanged) {
      merged[field as keyof T] = appValue as T[keyof T];
      if (!sameValue(appValue, sheetValue)) unresolvedAppChanges++;
      continue;
    }

    if (protectedFields.has(field)) {
      conflictingFields.push(field);
      merged[field as keyof T] = baselineValue as T[keyof T];
      continue;
    }

    merged[field as keyof T] = sheetValue as T[keyof T];
    if (!sameValue(sheetValue, appValue)) unresolvedSheetChanges++;
  }

  let action: SheetSyncAction;
  if (conflictingFields.length) action = "CONFLICT";
  else if (unresolvedAppChanges && unresolvedSheetChanges) action = "MERGE";
  else if (unresolvedAppChanges) action = "PUSH_APP";
  else if (unresolvedSheetChanges) action = "PULL_SHEET";
  else action = "NO_CHANGE";

  return { action, appChangedFields, sheetChangedFields, conflictingFields, merged };
}
