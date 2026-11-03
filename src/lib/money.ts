/**
 * Money helpers.
 *
 * All currency values are handled as integer minor units ("paisa", 1 ৳ = 100 paisa)
 * so that no floating-point arithmetic is ever used for accounting. User input is
 * parsed from strings directly into paisa, and only converted back to a decimal
 * string for display.
 */

const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Converts ASCII digits in a string to Bangla digits. */
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]);
}

/** UI language for number formatting: Bangla digits + lakh grouping, or ASCII digits + thousands grouping. */
export type NumberLocale = "bn" | "en";

/** Bangla digits for "bn"; unchanged ASCII digits for "en". */
export function localizeDigits(input: string | number, locale: NumberLocale = "bn"): string {
  return locale === "bn" ? toBanglaDigits(input) : String(input);
}

/** Converts Bangla digits in a string to ASCII digits (so users may type either). */
export function toAsciiDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

const DECIMAL_2 = /^\d+(\.\d{0,2})?$/;

/** Returns true when the string is a non-negative number with at most two decimals. */
export function isValidDecimal2(raw: string): boolean {
  const s = toAsciiDigits(raw.trim()).replace(/,/g, "");
  return s === "" || DECIMAL_2.test(s);
}

/**
 * Parses a decimal string with up to 2 fractional digits into hundredths
 * (paisa for money, 1/100 meal for meal counts). Empty input is 0.
 * Throws on invalid or negative input.
 */
export function parseHundredths(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) throw new Error(`Invalid amount: ${raw}`);
    // Numbers are only accepted when they already have at most 2 decimals.
    return parseHundredths(raw.toFixed(2));
  }
  const s = toAsciiDigits(raw.trim()).replace(/,/g, "");
  if (s === "") return 0;
  if (!DECIMAL_2.test(s)) throw new Error(`Invalid amount: ${raw}`);
  const [whole, frac = ""] = s.split(".");
  const value = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isSafeInteger(value)) throw new Error(`Amount too large: ${raw}`);
  return value;
}

/** Alias for clarity when parsing taka into paisa. */
export const takaToPaisa = parseHundredths;

/** Formats hundredths as a plain ASCII decimal string, e.g. 125050 -> "1250.50". */
export function hundredthsToDecimalString(value: number): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

/** Formats hundredths for an input field: drops a ".00" suffix, empty for zero. */
export function hundredthsToInput(value: number): string {
  if (!value) return "";
  const s = hundredthsToDecimalString(value);
  return s.endsWith(".00") ? s.slice(0, -3) : s.replace(/0$/, "");
}

/** Groups an integer string using the Bangladeshi (lakh/crore) convention: 12,34,567. */
function groupBangladeshi(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** Groups an integer string: lakh/crore for Bangla, thousands (1,234,567) for English. */
function groupDigits(whole: string, locale: NumberLocale): string {
  return locale === "bn" ? groupBangladeshi(whole) : whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Formats paisa as currency text, e.g. 500000 -> "৫,০০০.০০" (bn) or "5,000.00" (en). */
export function formatAmount(paisa: number, locale: NumberLocale = "bn"): string {
  const negative = paisa < 0;
  const abs = Math.abs(paisa);
  const whole = groupDigits(String(Math.floor(abs / 100)), locale);
  const frac = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${localizeDigits(`${whole}.${frac}`, locale)}`;
}

/** Formats paisa with the taka sign, e.g. 500000 -> "৳৫,০০০.০০". */
export function formatTaka(paisa: number, locale: NumberLocale = "bn"): string {
  const s = formatAmount(paisa, locale);
  return s.startsWith("-") ? `-৳${s.slice(1)}` : `৳${s}`;
}

/** Formats a meal count stored in hundredths, e.g. 4550 -> "৪৫.৫", 4500 -> "৪৫". */
export function formatMealUnits(units: number, locale: NumberLocale = "bn"): string {
  const whole = groupDigits(String(Math.floor(units / 100)), locale);
  const frac = units % 100;
  if (frac === 0) return localizeDigits(whole, locale);
  const fracStr = String(frac).padStart(2, "0").replace(/0$/, "");
  return localizeDigits(`${whole}.${fracStr}`, locale);
}

/** Converts a stored meal count (e.g. 45.5) into integer hundredths. */
export function mealCountToUnits(mealCount: number): number {
  return Math.round(mealCount * 100);
}

/** Converts integer hundredths into a meal count number for storage (e.g. 4550 -> 45.5). */
export function unitsToMealCount(units: number): number {
  return units / 100;
}
