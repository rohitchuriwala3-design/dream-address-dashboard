const indiaDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatIndiaDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";

  const parts = Object.fromEntries(
    indiaDateTime.formatToParts(date).map(({ type, value: partValue }) => [type, partValue]),
  );

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} IST`;
}
