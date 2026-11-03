import { z } from "zod";
import { isValidDecimal2, parseHundredths, toAsciiDigits } from "@/lib/money";
import type { CalcMemberInput, Expenses } from "@/types/accounting";

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "অবৈধ আইডি।");

/** Labels of the numeric fields; their messages are translated in src/i18n/messages.ts. */
export const DECIMAL_FIELD_LABELS = [
  "জমা",
  "মিল সংখ্যা",
  "বাজার খরচ",
  "চালের খরচ",
  "জ্বালানি খরচ",
  "অন্যান্য অতিরিক্ত খরচ",
] as const;
type DecimalFieldLabel = (typeof DECIMAL_FIELD_LABELS)[number];

export const decimalMessages = {
  negative: (label: string) => `${label} ঋণাত্মক হতে পারবে না।`,
  invalid: (label: string) => `${label} সঠিক সংখ্যায় লিখুন (সর্বোচ্চ দুই দশমিক ঘর)।`,
};

/** Non-negative decimal (up to 2 places) entered as text; Bangla digits allowed. */
const decimalField = (label: DecimalFieldLabel) =>
  z
    .string()
    .trim()
    .refine((s) => !toAsciiDigits(s).startsWith("-"), decimalMessages.negative(label))
    .refine(isValidDecimal2, decimalMessages.invalid(label));

export const monthSchema = z.coerce
  .number({ message: "মাস নির্বাচন করুন।" })
  .int()
  .min(1, "মাস নির্বাচন করুন।")
  .max(12, "মাস নির্বাচন করুন।");

export const yearSchema = z.coerce
  .number({ message: "বছর লিখুন।" })
  .int("বছর সঠিক নয়।")
  .min(2000, "বছর সঠিক নয়।")
  .max(2100, "বছর সঠিক নয়।");

const managerNameSchema = z.string().trim().max(100, "ম্যানেজারের নাম অনেক বড়।");

const uniqueBy = <T>(items: T[], key: (item: T) => string) =>
  new Set(items.map(key)).size === items.length;

export const accountMemberRowSchema = z.object({
  memberId: objectIdSchema,
  name: z.string(),
  investment: decimalField("জমা"),
  mealCount: decimalField("মিল সংখ্যা"),
});

export const expensesFormSchema = z.object({
  marketExpense: decimalField("বাজার খরচ"),
  riceExpense: decimalField("চালের খরচ"),
  fuelExpense: decimalField("জ্বালানি খরচ"),
  otherExtraExpense: decimalField("অন্যান্য অতিরিক্ত খরচ"),
});

/** Monthly accounting form (shared by the client form and the server actions). */
export const accountFormSchema = z.object({
  managerName: managerNameSchema,
  members: z
    .array(accountMemberRowSchema)
    .min(1, "কমপক্ষে একজন সদস্য যুক্ত করুন।")
    .refine((rows) => uniqueBy(rows, (r) => r.memberId), "একই সদস্য একাধিকবার যুক্ত করা যাবে না।"),
  expenses: expensesFormSchema,
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

/** Creating a new month: period, manager and the participating members. */
export const newMonthSchema = z.object({
  month: monthSchema,
  year: yearSchema,
  managerName: managerNameSchema,
  memberIds: z
    .array(objectIdSchema)
    .min(1, "কমপক্ষে একজন সদস্য নির্বাচন করুন।")
    .refine((ids) => uniqueBy(ids, (id) => id), "একই সদস্য একাধিকবার যুক্ত করা যাবে না।"),
});

export type NewMonthInput = z.infer<typeof newMonthSchema>;

export const periodSchema = z.object({ month: monthSchema, year: yearSchema });

/** Converts validated form strings into integer paisa / meal units. */
export function formToCalcInput(values: AccountFormValues): {
  members: CalcMemberInput[];
  expenses: Expenses;
} {
  return {
    members: values.members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      investment: parseHundredths(m.investment),
      mealUnits: parseHundredths(m.mealCount),
    })),
    expenses: {
      marketExpense: parseHundredths(values.expenses.marketExpense),
      riceExpense: parseHundredths(values.expenses.riceExpense),
      fuelExpense: parseHundredths(values.expenses.fuelExpense),
      otherExtraExpense: parseHundredths(values.expenses.otherExtraExpense),
    },
  };
}

/** Like formToCalcInput but tolerant of invalid rows (treated as 0) for live previews. */
export function formToCalcInputLenient(values: Partial<AccountFormValues>) {
  const safe = (s: string | undefined) => {
    try {
      return parseHundredths(s ?? "");
    } catch {
      return 0;
    }
  };
  return {
    members: (values.members ?? []).map((m) => ({
      memberId: m?.memberId ?? "",
      name: m?.name ?? "",
      investment: safe(m?.investment),
      mealUnits: safe(m?.mealCount),
    })),
    expenses: {
      marketExpense: safe(values.expenses?.marketExpense),
      riceExpense: safe(values.expenses?.riceExpense),
      fuelExpense: safe(values.expenses?.fuelExpense),
      otherExtraExpense: safe(values.expenses?.otherExtraExpense),
    },
  };
}
