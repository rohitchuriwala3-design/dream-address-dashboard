const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a calendar date as a UTC-midnight value for a PostgreSQL DATE field. */
export function parseCrmDateOnly(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) throw new Error("Invalid date");
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Invalid date");
  }
  return date;
}

/** Return the YYYY-MM-DD value for a stored DATE or valid ISO date input. */
export function toCrmDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
