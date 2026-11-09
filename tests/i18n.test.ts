import { describe, expect, it } from "vitest";
import { ISSUE_MESSAGES } from "@/features/accounting/calculate";
import { getI18nFor } from "@/i18n";
import bn from "@/i18n/dictionaries/bn";
import en from "@/i18n/dictionaries/en";
import { translateMessage } from "@/i18n/messages";
import { formatAmount, formatMealUnits, formatTaka } from "@/lib/money";
import { formatDate, periodLabel } from "@/lib/months";
import { accountFormSchema, newMonthSchema } from "@/schemas/accounting";
import {
  changePasswordSchema,
  hostelIdSchema,
  registerSchema,
  updateProfileSchema,
} from "@/schemas/auth";
import { createContactSchema, createMemberSchema } from "@/schemas/member";
import { MESSAGES } from "@/services/errors";

// Bangla letters and digits; the taka sign (U+09F3) is used in both languages.
const BANGLA = /[ঀ-৲৴-৿]/;

/** Collects every string a dictionary holds (calling functions with sample args). */
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return strings(value("1", "2"));
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

/** Every (deduplicated) message a schema reports for the given invalid input. */
function zodMessages(schema: { safeParse: (v: unknown) => { error?: { issues: { message: string }[] } } }, input: unknown) {
  return schema.safeParse(input).error?.issues.map((i) => i.message) ?? [];
}

describe("formatting", () => {
  it("keeps Bangla digits and lakh grouping by default", () => {
    expect(formatAmount(1234567800)).toBe("১,২৩,৪৫,৬৭৮.০০");
    expect(periodLabel(10, 2026)).toBe("অক্টোবর ২০২৬");
  });

  it("uses ASCII digits, thousands grouping and English months for en", () => {
    expect(formatAmount(1234567800, "en")).toBe("12,345,678.00");
    expect(formatTaka(-125050, "en")).toBe("-৳1,250.50");
    expect(formatMealUnits(4550, "en")).toBe("45.5");
    expect(periodLabel(10, 2026, "en")).toBe("October 2026");
    expect(formatDate(new Date("2026-10-31T06:00:00Z"), "en")).toBe("31 October 2026");
    expect(getI18nFor("en").f.meals(45.5)).toBe("45.5");
  });
});

describe("dictionaries", () => {
  it("English has no Bangla text except the language switch", () => {
    const leaks = strings({ ...en, common: { ...en.common, switchTo: "", switchToShort: "" } }).filter((s) =>
      BANGLA.test(s),
    );
    expect(leaks).toEqual([]);
  });

  it("English and Bangla have the same number of list items", () => {
    expect(en.landing.features).toHaveLength(bn.landing.features.length);
    expect(en.scrollPortrait.lines).toHaveLength(bn.scrollPortrait.lines.length);
    expect(en.report.columns).toHaveLength(bn.report.columns.length);
    expect(en.heroPreview.names).toHaveLength(bn.heroPreview.names.length);
  });
});

describe("message translation", () => {
  const untranslated = (messages: string[]) =>
    messages.filter((m) => BANGLA.test(translateMessage(m, "en")));

  it("translates every service and calculator message", () => {
    expect(untranslated([...Object.values(MESSAGES), ...Object.values(ISSUE_MESSAGES)])).toEqual([]);
  });

  it("translates the Zod validation messages", () => {
    const messages = [
      ...zodMessages(registerSchema, { name: "", email: "bad", hostelName: "", password: "x", confirmPassword: "y" }),
      ...zodMessages(registerSchema, { name: "x".repeat(101), email: "a@b.co", hostelName: "x".repeat(151), password: "12345678", confirmPassword: "1" }),
      ...zodMessages(changePasswordSchema, { currentPassword: "", newPassword: "x", confirmPassword: "y" }),
      ...zodMessages(updateProfileSchema, { name: "", email: "bad" }),
      ...zodMessages(hostelIdSchema, "a"),
      ...zodMessages(hostelIdSchema, "x".repeat(31)),
      ...zodMessages(hostelIdSchema, "bad id"),
      ...zodMessages(createMemberSchema, { name: "" }),
      ...zodMessages(createMemberSchema, { name: "x".repeat(101) }),
      ...zodMessages(createContactSchema, { name: "A", phone: "" }),
      ...zodMessages(createContactSchema, { name: "A", phone: "abc" }),
      ...zodMessages(newMonthSchema, { month: 0, year: 1999, managerName: "x".repeat(101), memberIds: [] }),
      ...zodMessages(newMonthSchema, { month: 1, year: 2026, managerName: "", memberIds: ["nope"] }),
      ...zodMessages(accountFormSchema, {
        managerName: "",
        members: [
          { memberId: "a".repeat(24), name: "A", investment: "-1", mealCount: "1.234" },
          { memberId: "a".repeat(24), name: "A", investment: "abc", mealCount: "-2" },
        ],
        expenses: { marketExpense: "-1", riceExpense: "x", fuelExpense: "-1", otherExtraExpense: "1.111" },
      }),
      ...zodMessages(accountFormSchema, {
        managerName: "",
        members: [],
        expenses: { marketExpense: "x", riceExpense: "-1", fuelExpense: "x", otherExtraExpense: "-1" },
      }),
    ];
    expect(messages.length).toBeGreaterThan(20);
    expect(untranslated(messages)).toEqual([]);
  });

  it("returns Bangla unchanged and unknown messages as-is", () => {
    expect(translateMessage(MESSAGES.UNKNOWN, "bn")).toBe(MESSAGES.UNKNOWN);
    expect(translateMessage("something else", "en")).toBe("something else");
  });
});
