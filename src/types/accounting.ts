/**
 * Shared accounting types.
 *
 * Unless stated otherwise every money value is an integer number of paisa
 * (1 ৳ = 100 paisa) and every meal value passed to calculations is an integer
 * number of hundredths of a meal ("meal units", 1 meal = 100 units).
 */

export type AccountStatus = "DRAFT" | "PUBLISHED";

export interface Expenses {
  marketExpense: number;
  riceExpense: number;
  fuelExpense: number;
  otherExtraExpense: number;
}

export interface CalcMemberInput {
  memberId: string;
  name: string;
  /** Deposit for this month, paisa. */
  investment: number;
  /** Meals in hundredths (45.5 meals = 4550). */
  mealUnits: number;
}

export interface CalcMemberResult extends CalcMemberInput {
  mealCost: number;
  extraCost: number;
  totalCost: number;
  /** investment - totalCost (may be negative). */
  balance: number;
  outstandingBalance: number;
  refundAmount: number;
}

export interface CalcSummary {
  totalMembers: number;
  /** Hundredths of a meal. */
  totalMealUnits: number;
  totalDeposits: number;
  totalFoodCost: number;
  totalExtraCost: number;
  /** Meal rate rounded to the nearest paisa (half-up); null when there are no meals. */
  mealRate: number | null;
  /** Equal share rounded to the nearest paisa (half-up); null when there are no members. */
  extraCostPerMember: number | null;
  totalMemberCost: number;
  totalOutstanding: number;
  totalRefund: number;
}

export type CalcIssueCode =
  | "NO_MEMBERS"
  | "ZERO_MEALS"
  | "DUPLICATE_MEMBER"
  | "RECONCILIATION_FAILED";

export interface CalcIssue {
  code: CalcIssueCode;
  message: string;
}

export interface CalcResult {
  members: CalcMemberResult[];
  summary: CalcSummary;
  issues: CalcIssue[];
  /** True when the data is complete enough to be published. */
  isValid: boolean;
}

/** Serializable member entry as stored in a monthly record. */
export interface MonthlyMemberDTO {
  memberId: string;
  name: string;
  investment: number;
  mealCount: number;
  mealCost: number;
  extraCost: number;
  totalCost: number;
  outstandingBalance: number;
  refundAmount: number;
}

/** Serializable monthly accounting record (safe to pass to client components). */
export interface MonthlyAccountDTO {
  id: string;
  month: number;
  year: number;
  managerName: string;
  members: MonthlyMemberDTO[];
  expenses: Expenses;
  mealRate: number | null;
  totalMembers: number;
  totalMeals: number;
  totalDeposits: number;
  totalFoodCost: number;
  totalExtraCost: number;
  extraCostPerMember: number | null;
  totalMemberCost: number;
  status: AccountStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactDTO {
  id: string;
  name: string;
  phone: string;
}

export interface MemberDTO {
  id: string;
  name: string;
  isActive: boolean;
  phone: string;
  hiddenFromContacts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodRef {
  id: string;
  month: number;
  year: number;
}
