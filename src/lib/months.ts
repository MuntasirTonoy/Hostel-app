import { toBanglaDigits } from "./money";

export const BANGLA_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

export function monthName(month: number): string {
  return BANGLA_MONTHS[month - 1] ?? "";
}

/** e.g. (10, 2026) -> "অক্টোবর ২০২৬" */
export function periodLabel(month: number, year: number): string {
  return `${monthName(month)} ${toBanglaDigits(year)}`;
}

/** Sortable period number, e.g. (10, 2026) -> 202610 */
export function periodKey(month: number, year: number): number {
  return year * 100 + month;
}

/** URL slug for a period, e.g. (9, 2026) -> "2026-09" */
export function periodSlug(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parsePeriodSlug(slug: string): { month: number; year: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(slug);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

/** Current month/year in Bangladesh time (Asia/Dhaka). */
export function currentPeriod(now: Date = new Date()): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { month, year };
}

/** Formats a date in Bangla, Bangladesh time, e.g. "৩১ অক্টোবর ২০২৬". */
export function formatBanglaDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return `${toBanglaDigits(get("day"))} ${monthName(get("month"))} ${toBanglaDigits(get("year"))}`;
}
