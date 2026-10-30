import { formatAmount, formatMealUnits, formatTaka, mealCountToUnits, toBanglaDigits } from "@/lib/money";
import { formatBanglaDate, periodLabel } from "@/lib/months";
import { cn } from "@/lib/utils";
import type { MonthlyAccountDTO } from "@/types/accounting";

export type ReportData = Pick<
  MonthlyAccountDTO,
  | "month"
  | "year"
  | "managerName"
  | "members"
  | "expenses"
  | "mealRate"
  | "totalMembers"
  | "totalMeals"
  | "totalDeposits"
  | "totalFoodCost"
  | "totalExtraCost"
  | "extraCostPerMember"
  | "totalMemberCost"
>;

const COLUMNS = [
  "নাম",
  "জমা (৳)",
  "মিল সংখ্যা",
  "অতিরিক্ত খরচ (৳)",
  "চলতি মাসের মোট খরচ (৳)",
  "বকেয়া আছে (৳)",
  "ফেরত পাবে (৳)",
] as const;

export function ReportView({
  report,
  hostelName,
  generatedAt,
  id,
}: {
  report: ReportData;
  hostelName?: string;
  generatedAt?: Date;
  id?: string;
}) {
  const totalOutstanding = report.members.reduce((s, m) => s + m.outstandingBalance, 0);
  const totalRefund = report.members.reduce((s, m) => s + m.refundAmount, 0);
  const summary: [string, string][] = [
    ["মোট সদস্য", `${toBanglaDigits(report.totalMembers)} জন`],
    ["মোট মিল", `${formatMealUnits(mealCountToUnits(report.totalMeals))}টি`],
    ["মোট জমা", formatTaka(report.totalDeposits)],
    ["মোট বাজার খরচ", formatTaka(report.expenses.marketExpense)],
    ["মোট চালের খরচ", formatTaka(report.expenses.riceExpense)],
    ["জ্বালানি খরচ", formatTaka(report.expenses.fuelExpense)],
    ["অন্যান্য অতিরিক্ত খরচ", formatTaka(report.expenses.otherExtraExpense)],
    ["মোট অতিরিক্ত খরচ", formatTaka(report.totalExtraCost)],
    [
      "জনপ্রতি অতিরিক্ত খরচ",
      report.extraCostPerMember === null ? "—" : formatTaka(report.extraCostPerMember),
    ],
    ["সদস্যদের মোট খরচ", formatTaka(report.totalMemberCost)],
    ["মোট বকেয়া", formatTaka(totalOutstanding)],
    ["মোট ফেরত", formatTaka(totalRefund)],
  ];

  return (
    <article id={id} className="space-y-6 bg-background">
      <header className="text-center space-y-1">
        {hostelName ? <p className="text-base font-semibold text-primary">{hostelName}</p> : null}
        <h1 className="text-2xl sm:text-3xl font-bold">
          মাসিক হিসাব — {periodLabel(report.month, report.year)}
        </h1>
        <p className="text-muted-foreground">
          ম্যানেজার: <span className="font-medium text-foreground">{report.managerName || "—"}</span>
        </p>
      </header>

      <div className="print-table-wrap overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-sm sm:text-base">
          <thead className="bg-muted/60">
            <tr>
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    "px-3 py-3 font-semibold whitespace-nowrap border-b",
                    i === 0 ? "text-left sticky left-0 bg-muted" : "text-right",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  কোনো সদস্য যুক্ত করা হয়নি।
                </td>
              </tr>
            ) : (
              report.members.map((m) => (
                <tr key={m.memberId} className="border-b last:border-b-0 even:bg-muted/20">
                  <th
                    scope="row"
                    className="px-3 py-2.5 text-left font-medium whitespace-nowrap sticky left-0 bg-background"
                  >
                    {m.name}
                  </th>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(m.investment)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatMealUnits(mealCountToUnits(m.mealCount))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatAmount(m.extraCost)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {formatAmount(m.totalCost)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums",
                      m.outstandingBalance > 0
                        ? "font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatAmount(m.outstandingBalance)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums",
                      m.refundAmount > 0
                        ? "font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatAmount(m.refundAmount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-muted/60 font-semibold">
            <tr className="border-t">
              <th scope="row" className="px-3 py-3 text-left sticky left-0 bg-muted">
                সর্বমোট
              </th>
              <td className="px-3 py-3 text-right tabular-nums">{formatAmount(report.totalDeposits)}</td>
              <td className="px-3 py-3 text-right tabular-nums">
                {formatMealUnits(mealCountToUnits(report.totalMeals))}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">{formatAmount(report.totalExtraCost)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatAmount(report.totalMemberCost)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-red-600">
                {formatAmount(totalOutstanding)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-emerald-700">
                {formatAmount(totalRefund)}
              </td>
            </tr>
            <tr className="border-t">
              <td colSpan={7} className="px-3 py-3 text-center text-lg">
                মিল রেট:{" "}
                <span className="text-primary">
                  {report.mealRate === null ? "—" : `${formatAmount(report.mealRate)} টাকা`}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section aria-labelledby="summary-heading" className="space-y-3">
        <h2 id="summary-heading" className="text-lg font-semibold">
          মাসিক খরচের সারসংক্ষেপ
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3 lg:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="bg-background p-3">
              <dt className="text-xs sm:text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {generatedAt ? (
        <p className="text-center text-xs text-muted-foreground">
          রিপোর্ট তৈরির তারিখ: {formatBanglaDate(generatedAt)}
        </p>
      ) : null}
    </article>
  );
}
