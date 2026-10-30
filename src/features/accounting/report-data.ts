import type { ReportData } from "@/components/report/report-view";
import { unitsToMealCount } from "@/lib/money";
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
