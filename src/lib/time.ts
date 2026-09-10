export const DAY_CODES = ["MO", "TU", "WE", "TH", "FR"] as const;
export type DayCode = (typeof DAY_CODES)[number];

export const DAY_LABELS: Record<DayCode, string> = {
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
};

export const DAY_SHORT: Record<DayCode, string> = {
  MO: "Mon",
  TU: "Tue",
  WE: "Wed",
  TH: "Thu",
  FR: "Fri",
};

export function parseDays(days: string): DayCode[] {
  return days
    .split(",")
    .map((d) => d.trim())
    .filter((d): d is DayCode => DAY_CODES.includes(d as DayCode));
}

/** "14:00" -> "2:00 PM" */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatDays(days: string): string {
  return parseDays(days)
    .map((d) => DAY_SHORT[d])
    .join(", ");
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** True if two weekly meeting patterns share a day and overlap in time. */
export function meetingsOverlap(
  a: { days: string; startTime: string; endTime: string },
  b: { days: string; startTime: string; endTime: string }
): boolean {
  const daysA = new Set(parseDays(a.days));
  const daysB = parseDays(b.days);
  if (!daysB.some((d) => daysA.has(d))) return false;

  const aStart = toMinutes(a.startTime);
  const aEnd = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd = toMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}
