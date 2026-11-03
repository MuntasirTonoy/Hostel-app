import type { ReportData } from "@/components/report/report-view";
import { mealCountToUnits, unitsToMealCount } from "@/lib/money";
import type { CalcResult, Expenses } from "@/types/accounting";

/** Builds report-table data from a live calculation (used by the admin preview). */
export function calcToReportData(
  calc: CalcResult,
  meta: { month: number; year: number; managerName: string; expenses: Expenses },
): ReportData {
  return {
    month: meta.month,
    year: meta.year,
    managerName: meta.managerName,
    expenses: meta.expenses,
    members: calc.members.map((m) => ({
      memberId: m.memberId,
      name: m.name,
      investment: m.investment,
      mealCount: unitsToMealCount(m.mealUnits),
      mealCost: m.mealCost,
      extraCost: m.extraCost,
      totalCost: m.totalCost,
      outstandingBalance: m.outstandingBalance,
      refundAmount: m.refundAmount,
    })),
    mealRate: calc.summary.mealRate,
    totalMembers: calc.summary.totalMembers,
    totalMeals: unitsToMealCount(calc.summary.totalMealUnits),
    totalDeposits: calc.summary.totalDeposits,
    totalFoodCost: calc.summary.totalFoodCost,
    totalExtraCost: calc.summary.totalExtraCost,
    extraCostPerMember: calc.summary.extraCostPerMember,
    totalMemberCost: calc.summary.totalMemberCost,
  };
}

/** The figures shown in the "মাসিক খরচের সারসংক্ষেপ" grid, used to compare two months. */
export interface SummaryMetrics {
  month: number;
  year: number;
  totalMembers: number;
  /** Meal hundredths. */
  totalMealUnits: number;
  totalDeposits: number;
  marketExpense: number;
  riceExpense: number;
  fuelExpense: number;
  otherExtraExpense: number;
  totalExtraCost: number;
  extraCostPerMember: number | null;
  totalMemberCost: number;
  totalOutstanding: number;
  totalRefund: number;
}

export function summaryMetrics(report: ReportData): SummaryMetrics {
  return {
    month: report.month,
    year: report.year,
    totalMembers: report.totalMembers,
    totalMealUnits: mealCountToUnits(report.totalMeals),
    totalDeposits: report.totalDeposits,
    marketExpense: report.expenses.marketExpense,
    riceExpense: report.expenses.riceExpense,
    fuelExpense: report.expenses.fuelExpense,
    otherExtraExpense: report.expenses.otherExtraExpense,
    totalExtraCost: report.totalExtraCost,
    extraCostPerMember: report.extraCostPerMember,
    totalMemberCost: report.totalMemberCost,
    totalOutstanding: report.members.reduce((s, m) => s + m.outstandingBalance, 0),
    totalRefund: report.members.reduce((s, m) => s + m.refundAmount, 0),
  };
}
