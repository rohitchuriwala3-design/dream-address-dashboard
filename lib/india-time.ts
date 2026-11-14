const indiaDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatIndiaDate(value: Date | string | null | undefined, locale = "en-IN") {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
  }).format(date);
}

export function formatIndiaDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  const parts = Object.fromEntries(
    indiaDateTime.formatToParts(date).map(({ type, value: partValue }) => [type, partValue]),
  );

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} IST`;
}

export function formatIndiaDateTimeLocalInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseIndiaDateTimeLocalInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return new Date(Number.NaN);
  const [, rawYear, rawMonth, rawDay, rawHour, rawMinute] = match;
  const [year, month, day, hour, minute] = [rawYear, rawMonth, rawDay, rawHour, rawMinute].map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute) - (5 * 60 + 30) * 60_000);
  return formatIndiaDateTimeLocalInput(date) === value ? date : new Date(Number.NaN);
}
