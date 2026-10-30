/**
 * Monthly accounting calculator — the single source of truth for every number
 * shown in the app. It is a pure module (no database, no UI) so the server can
 * use it to persist authoritative snapshots and the admin form can reuse it for
 * the live preview.
 *
 * Precision & rounding policy
 * ---------------------------
 * - Money is integer paisa, meals are integer hundredths of a meal. No floats.
 * - Meal rate (মিল রেট) = total food cost ÷ total meals. The *unrounded* rate is
 *   used for member bills; the displayed/stored rate is rounded half-up to the
 *   nearest paisa (two decimals).
 * - Member meal cost = member meals × unrounded meal rate. Because every
 *   member's exact share is a fraction of a paisa, shares are rounded with the
 *   largest-remainder method so that Σ meal costs == total food cost exactly:
 *     1. every member gets floor(exact share);
 *     2. the leftover paisa (always < number of members) are handed out one at a
 *        time to the members with the largest fractional remainder;
 *     3. ties are broken by memberId (ascending string order), which is stable
 *        and independent of the order members are listed in the form.
 *   No member's bill ever moves by more than 1 paisa from its exact value.
 * - Extra cost per member = (fuel + other extra) ÷ member count, distributed with
 *   the same method so Σ extra costs == total extra cost exactly.
 * - Balance = deposit − (meal cost + extra cost). Negative → outstanding
 *   (বকেয়া), positive → refund (ফেরত). Never both.
 * - A reconciliation check verifies all totals after every calculation.
 */
import type {
  CalcIssue,
  CalcMemberInput,
  CalcMemberResult,
  CalcResult,
  Expenses,
} from "@/types/accounting";

export const ISSUE_MESSAGES = {
  NO_MEMBERS: "কমপক্ষে একজন সদস্য যুক্ত করুন।",
  ZERO_MEALS: "মোট মিল শূন্য হওয়ায় মিল রেট হিসাব করা যাচ্ছে না। হিসাব প্রকাশের আগে মিল সংখ্যা যুক্ত করুন।",
  DUPLICATE_MEMBER: "একই সদস্য একাধিকবার যুক্ত করা হয়েছে।",
  RECONCILIATION_FAILED: "হিসাব মিলানো যায়নি। অনুগ্রহ করে তথ্যগুলো আবার যাচাই করুন।",
} as const;

/** Integer division rounded half-up (for non-negative operands). */
export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

/**
 * Splits `total` into integer parts proportional to `weights` using the
 * largest-remainder method. `tieKeys` breaks ties deterministically.
 * The parts always sum exactly to `total`.
 */
export function allocateProportionally(
  total: number,
  weights: number[],
  tieKeys: string[],
): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weights.length === 0 || weightSum === 0) return weights.map(() => 0);

  const T = BigInt(total);
  const W = BigInt(weightSum);
  const parts = weights.map((w) => {
    const exact = T * BigInt(w);
    return { base: exact / W, remainder: exact % W };
  });

  let leftover = T - parts.reduce((acc, p) => acc + p.base, 0n);
  const order = parts
    .map((p, index) => ({ index, remainder: p.remainder }))
    .sort((a, b) => {
      if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
      const ka = tieKeys[a.index];
      const kb = tieKeys[b.index];
      return ka < kb ? -1 : ka > kb ? 1 : a.index - b.index;
    });

  const result = parts.map((p) => p.base);
  for (const { index } of order) {
    if (leftover <= 0n) break;
    result[index] += 1n;
    leftover -= 1n;
  }
  return result.map(Number);
}

export function calculateMonthlyAccount(input: {
  members: CalcMemberInput[];
  expenses: Expenses;
}): CalcResult {
  const { members, expenses } = input;
  const issues: CalcIssue[] = [];
  const addIssue = (code: CalcIssue["code"]) => {
    if (!issues.some((i) => i.code === code)) issues.push({ code, message: ISSUE_MESSAGES[code] });
  };

  for (const m of members) {
    if (!Number.isSafeInteger(m.investment) || m.investment < 0)
      throw new Error(`Invalid investment for member ${m.memberId}`);
    if (!Number.isSafeInteger(m.mealUnits) || m.mealUnits < 0)
      throw new Error(`Invalid meal count for member ${m.memberId}`);
  }
  for (const [key, value] of Object.entries(expenses)) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid expense ${key}`);
  }

  const ids = new Set(members.map((m) => m.memberId));
  if (ids.size !== members.length) addIssue("DUPLICATE_MEMBER");

  // Step 1 & 2
  const totalMembers = members.length;
  const totalMealUnits = members.reduce((a, m) => a + m.mealUnits, 0);
  const totalDeposits = members.reduce((a, m) => a + m.investment, 0);

  // Step 3 & 5
  const totalFoodCost = expenses.marketExpense + expenses.riceExpense;
  const totalExtraCost = expenses.fuelExpense + expenses.otherExtraExpense;

  if (totalMembers === 0) addIssue("NO_MEMBERS");
  if (totalMealUnits === 0) addIssue("ZERO_MEALS");

  // Step 4: meal rate per whole meal = food cost ÷ (units / 100)
  const mealRate =
    totalMealUnits > 0
      ? Number(divRoundHalfUp(BigInt(totalFoodCost) * 100n, BigInt(totalMealUnits)))
      : null;

  // Step 6
  const extraCostPerMember =
    totalMembers > 0 ? Number(divRoundHalfUp(BigInt(totalExtraCost), BigInt(totalMembers))) : null;

  const tieKeys = members.map((m) => m.memberId);
  // Step 7: meal cost ∝ meals (equivalent to meals × unrounded rate)
  const mealCosts =
    totalMealUnits > 0
      ? allocateProportionally(totalFoodCost, members.map((m) => m.mealUnits), tieKeys)
      : members.map(() => 0);
  // Step 6 (distribution): equal weights
  const extraCosts =
    totalMembers > 0
      ? allocateProportionally(totalExtraCost, members.map(() => 1), tieKeys)
      : [];

  // Steps 8 & 9
  const results: CalcMemberResult[] = members.map((m, i) => {
    const mealCost = mealCosts[i];
    const extraCost = extraCosts[i];
    const totalCost = mealCost + extraCost;
    const balance = m.investment - totalCost;
    return {
      ...m,
      mealCost,
      extraCost,
      totalCost,
      balance,
      outstandingBalance: balance < 0 ? -balance : 0,
      refundAmount: balance > 0 ? balance : 0,
    };
  });

  const summary = {
    totalMembers,
    totalMealUnits,
    totalDeposits,
    totalFoodCost,
    totalExtraCost,
    mealRate,
    extraCostPerMember,
    totalMemberCost: results.reduce((a, m) => a + m.totalCost, 0),
    totalOutstanding: results.reduce((a, m) => a + m.outstandingBalance, 0),
    totalRefund: results.reduce((a, m) => a + m.refundAmount, 0),
  };

  const result: CalcResult = { members: results, summary, issues, isValid: false };
  if (!reconcile(result, expenses)) addIssue("RECONCILIATION_FAILED");
  result.isValid = issues.length === 0;
  return result;
}

/**
 * Verifies that the calculated figures are internally consistent:
 * - Σ meal costs equals total food cost (when there are meals),
 * - Σ extra costs equals total extra cost (when there are members),
 * - every member has outstanding XOR refund and they match the balance,
 * - Σ outstanding − Σ refund equals total cost − total deposits.
 */
export function reconcile(result: CalcResult, expenses: Expenses): boolean {
  const { members, summary } = result;
  const sum = (f: (m: CalcMemberResult) => number) => members.reduce((a, m) => a + f(m), 0);

  if (summary.totalFoodCost !== expenses.marketExpense + expenses.riceExpense) return false;
  if (summary.totalExtraCost !== expenses.fuelExpense + expenses.otherExtraExpense) return false;
  if (summary.totalMealUnits > 0 && sum((m) => m.mealCost) !== summary.totalFoodCost) return false;
  if (summary.totalMembers > 0 && sum((m) => m.extraCost) !== summary.totalExtraCost) return false;
  if (sum((m) => m.totalCost) !== summary.totalMemberCost) return false;

  for (const m of members) {
    if (m.totalCost !== m.mealCost + m.extraCost) return false;
    if (m.outstandingBalance < 0 || m.refundAmount < 0) return false;
    if (m.outstandingBalance > 0 && m.refundAmount > 0) return false;
    if (m.refundAmount - m.outstandingBalance !== m.investment - m.totalCost) return false;
  }

  return (
    summary.totalOutstanding - summary.totalRefund === summary.totalMemberCost - summary.totalDeposits
  );
}
