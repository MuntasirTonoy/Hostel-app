import { describe, expect, it } from "vitest";
import {
  allocateProportionally,
  calculateMonthlyAccount,
  divRoundHalfUp,
  reconcile,
} from "@/features/accounting/calculate";
import { formatAmount, formatMealUnits, formatTaka, parseHundredths } from "@/lib/money";
import type { CalcMemberInput, Expenses } from "@/types/accounting";

const tk = (taka: number) => Math.round(taka * 100);
const expenses = (market: number, rice: number, fuel: number, other: number): Expenses => ({
  marketExpense: tk(market),
  riceExpense: tk(rice),
  fuelExpense: tk(fuel),
  otherExtraExpense: tk(other),
});
const member = (id: string, name: string, deposit: number, meals: number): CalcMemberInput => ({
  memberId: id.padStart(24, "0"),
  name,
  investment: tk(deposit),
  mealUnits: Math.round(meals * 100),
});

describe("calculateMonthlyAccount", () => {
  const sample = () =>
    calculateMonthlyAccount({
      members: [member("a", "রহিম", 5000, 45), member("b", "করিম", 1000, 38)],
      expenses: expenses(2000, 490, 150, 50),
    });

  it("calculates totals and the meal rate", () => {
    const { summary, isValid } = sample();
    expect(isValid).toBe(true);
    expect(summary.totalMembers).toBe(2);
    expect(summary.totalMealUnits).toBe(8300);
    expect(summary.totalDeposits).toBe(tk(6000));
    expect(summary.totalFoodCost).toBe(tk(2490));
    expect(summary.totalExtraCost).toBe(tk(200));
    expect(summary.mealRate).toBe(tk(30)); // 2490 ÷ 83
  });

  it("divides extra expenses equally regardless of meals", () => {
    const { members, summary } = sample();
    expect(summary.extraCostPerMember).toBe(tk(100));
    expect(members.map((m) => m.extraCost)).toEqual([tk(100), tk(100)]);
  });

  it("calculates individual meal cost and total cost", () => {
    const [rahim, karim] = sample().members;
    expect(rahim.mealCost).toBe(tk(1350));
    expect(rahim.totalCost).toBe(tk(1450));
    expect(karim.mealCost).toBe(tk(1140));
    expect(karim.totalCost).toBe(tk(1240));
  });

  it("calculates refunds and outstanding balances (never both)", () => {
    const [rahim, karim] = sample().members;
    expect(rahim.refundAmount).toBe(tk(3550));
    expect(rahim.outstandingBalance).toBe(0);
    expect(karim.outstandingBalance).toBe(tk(240));
    expect(karim.refundAmount).toBe(0);
  });

  it("gives zero outstanding and zero refund for an exact balance", () => {
    const { members } = calculateMonthlyAccount({
      members: [member("a", "A", 300, 10)],
      expenses: expenses(250, 0, 50, 0),
    });
    expect(members[0].totalCost).toBe(tk(300));
    expect(members[0].outstandingBalance).toBe(0);
    expect(members[0].refundAmount).toBe(0);
  });

  it("handles zero meals without dividing by zero and blocks publishing", () => {
    const result = calculateMonthlyAccount({
      members: [member("a", "A", 100, 0), member("b", "B", 100, 0)],
      expenses: expenses(500, 0, 100, 0),
    });
    expect(result.summary.mealRate).toBeNull();
    expect(result.members.every((m) => m.mealCost === 0)).toBe(true);
    expect(result.members.map((m) => m.extraCost)).toEqual([tk(50), tk(50)]);
    expect(result.isValid).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("ZERO_MEALS");
  });

  it("flags an empty member list", () => {
    const result = calculateMonthlyAccount({ members: [], expenses: expenses(0, 0, 100, 0) });
    expect(result.summary.extraCostPerMember).toBeNull();
    expect(result.issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(["NO_MEMBERS", "ZERO_MEALS"]),
    );
  });

  it("flags duplicate members", () => {
    const result = calculateMonthlyAccount({
      members: [member("a", "A", 0, 1), member("a", "A", 0, 1)],
      expenses: expenses(10, 0, 0, 0),
    });
    expect(result.issues.map((i) => i.code)).toContain("DUPLICATE_MEMBER");
  });

  it("rounds fractional meal rates and distributes the remainder deterministically", () => {
    const result = calculateMonthlyAccount({
      members: [member("c", "C", 0, 1), member("a", "A", 0, 1), member("b", "B", 0, 1)],
      expenses: expenses(1000, 0, 100, 0),
    });
    // 1000 ÷ 3 = 333.333… → displayed 333.33
    expect(result.summary.mealRate).toBe(33333);
    // 100000 paisa = 33333 × 3 + 1 → the extra paisa goes to the lowest memberId ("a")
    const byName = Object.fromEntries(result.members.map((m) => [m.name, m]));
    expect(byName.A.mealCost).toBe(33334);
    expect(byName.B.mealCost).toBe(33333);
    expect(byName.C.mealCost).toBe(33333);
    expect(byName.A.extraCost).toBe(3334);
    expect(result.summary.extraCostPerMember).toBe(3333);
    // Totals reconcile exactly
    expect(result.summary.totalMemberCost).toBe(tk(1100));
    expect(result.isValid).toBe(true);
  });

  it("produces the same bills regardless of member order", () => {
    const members = [member("x", "X", 50, 7), member("y", "Y", 10, 3), member("z", "Z", 0, 11)];
    const e = expenses(1234.57, 99.99, 33.33, 0.01);
    const a = calculateMonthlyAccount({ members, expenses: e });
    const b = calculateMonthlyAccount({ members: [...members].reverse(), expenses: e });
    const map = (r: typeof a) => Object.fromEntries(r.members.map((m) => [m.memberId, m.totalCost]));
    expect(map(a)).toEqual(map(b));
  });

  it("supports half meals", () => {
    const result = calculateMonthlyAccount({
      members: [member("a", "A", 0, 2.5), member("b", "B", 0, 1.5)],
      expenses: expenses(400, 0, 0, 0),
    });
    expect(result.summary.mealRate).toBe(tk(100));
    expect(result.members.map((m) => m.mealCost)).toEqual([tk(250), tk(150)]);
  });

  it("rounds the displayed meal rate half-up", () => {
    // 1.00 ÷ 8 = 0.125 → 0.13
    const result = calculateMonthlyAccount({
      members: [member("a", "A", 0, 8)],
      expenses: expenses(1, 0, 0, 0),
    });
    expect(result.summary.mealRate).toBe(13);
  });

  it("always reconciles on random data", () => {
    let seed = 42;
    const rand = (max: number) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed % max;
    };
    for (let run = 0; run < 300; run++) {
      const count = 1 + rand(15);
      const members = Array.from({ length: count }, (_, i) => ({
        memberId: String(i).padStart(24, "0"),
        name: `M${i}`,
        investment: rand(1_000_000),
        mealUnits: rand(10) === 0 ? 0 : rand(9000) + 50,
      }));
      if (members.every((m) => m.mealUnits === 0)) members[0].mealUnits = 100;
      const e = {
        marketExpense: rand(5_000_000),
        riceExpense: rand(1_000_000),
        fuelExpense: rand(300_000),
        otherExtraExpense: rand(300_000),
      };
      const result = calculateMonthlyAccount({ members, expenses: e });
      expect(result.isValid).toBe(true);
      expect(reconcile(result, e)).toBe(true);
      expect(result.summary.totalMemberCost).toBe(
        e.marketExpense + e.riceExpense + e.fuelExpense + e.otherExtraExpense,
      );
      for (const m of result.members) {
        expect(m.outstandingBalance > 0 && m.refundAmount > 0).toBe(false);
      }
    }
  });

  it("rejects negative input", () => {
    expect(() =>
      calculateMonthlyAccount({
        members: [{ memberId: "a", name: "A", investment: -1, mealUnits: 0 }],
        expenses: expenses(0, 0, 0, 0),
      }),
    ).toThrow();
  });
});

describe("helpers", () => {
  it("divRoundHalfUp rounds half up", () => {
    expect(divRoundHalfUp(5n, 2n)).toBe(3n);
    expect(divRoundHalfUp(4n, 3n)).toBe(1n);
    expect(divRoundHalfUp(5n, 3n)).toBe(2n);
  });

  it("allocateProportionally always sums to the total", () => {
    expect(allocateProportionally(10, [1, 1, 1], ["a", "b", "c"])).toEqual([4, 3, 3]);
    expect(allocateProportionally(10, [1, 1, 1], ["c", "b", "a"])).toEqual([3, 3, 4]);
    expect(allocateProportionally(0, [1, 2], ["a", "b"])).toEqual([0, 0]);
  });

  it("parses taka strings into paisa without floating point errors", () => {
    expect(parseHundredths("0.1")).toBe(10);
    expect(parseHundredths("1250.5")).toBe(125050);
    expect(parseHundredths("১,২৫০.৫০")).toBe(125050);
    expect(parseHundredths("")).toBe(0);
    expect(() => parseHundredths("-5")).toThrow();
    expect(() => parseHundredths("1.234")).toThrow();
  });

  it("formats Bangla currency with Bangladeshi grouping", () => {
    expect(formatTaka(500000)).toBe("৳৫,০০০.০০");
    expect(formatTaka(125050)).toBe("৳১,২৫০.৫০");
    expect(formatAmount(1234567800)).toBe("১,২৩,৪৫,৬৭৮.০০");
    expect(formatMealUnits(4500)).toBe("৪৫");
    expect(formatMealUnits(4550)).toBe("৪৫.৫");
  });
});
