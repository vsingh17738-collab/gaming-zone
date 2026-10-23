export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function addMonthsFirstDay(month: string, offset = 0) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (monthNumber ?? 1) - 1 + offset, 1));
  return date.toISOString().slice(0, 10);
}

export function monthRange(month: string) {
  const start = addMonthsFirstDay(month);
  const end = addMonthsFirstDay(month, 1);
  return { start, end };
}

export function formatEventDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00Z`) : value;
  return new Intl.DateTimeFormat("en-IN", options ?? {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function slotLabel(slot: "morning" | "evening" | "full_day") {
  return { morning: "Morning · 8 AM–3 PM", evening: "Evening · 4 PM–11 PM", full_day: "Full day" }[slot];
}
