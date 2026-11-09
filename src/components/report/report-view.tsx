"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { summaryMetrics, type SummaryMetrics } from "@/features/accounting/report-data";
import { useI18n } from "@/i18n/client";
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

/** Reports up to this size print on one A4 portrait page; larger ones stay landscape. */
const PORTRAIT_PRINT_MAX_MEMBERS = 15;

export function ReportView({
  report,
  hostelName,
  generatedAt,
  id,
  showSummary = true,
  previous,
}: {
  report: ReportData;
  hostelName?: string;
  generatedAt?: Date;
  id?: string;
  showSummary?: boolean;
  /** The previous published month; when given, the summary shows ▲/▼ changes against it. */
  previous?: SummaryMetrics | null;
}) {
  const { t, f } = useI18n();
  const r = t.report;
  const s = r.summary;
  const current = summaryMetrics(report);
  const { totalOutstanding, totalRefund } = current;
  const format = (unit: SummaryUnit, value: number) =>
    unit === "people"
      ? t.common.people(f.num(value))
      : unit === "meals"
        ? t.common.meals(f.mealUnits(value))
        : f.taka(value);
  const summary: SummaryItem[] = [
    { key: "totalMembers", label: s.totalMembers, unit: "people", trend: "neutral" },
    { key: "totalMealUnits", label: s.totalMeals, unit: "meals", trend: "neutral" },
    { key: "totalDeposits", label: s.totalDeposits, unit: "taka", trend: "income" },
    { key: "marketExpense", label: s.market, unit: "taka", trend: "cost" },
    { key: "riceExpense", label: s.rice, unit: "taka", trend: "cost" },
    { key: "fuelExpense", label: s.fuel, unit: "taka", trend: "cost" },
    { key: "otherExtraExpense", label: s.otherExtra, unit: "taka", trend: "cost" },
    { key: "totalExtraCost", label: s.totalExtra, unit: "taka", trend: "cost" },
    { key: "extraCostPerMember", label: s.extraPerMember, unit: "taka", trend: "cost" },
    { key: "totalMemberCost", label: s.memberCost, unit: "taka", trend: "cost" },
    { key: "totalOutstanding", label: s.totalDue, unit: "taka", trend: "cost" },
    { key: "totalRefund", label: s.totalRefund, unit: "taka", trend: "neutral" },
  ];
  const previousLabel = previous ? f.period(previous.month, previous.year) : "";

  const printPortrait = report.members.length <= PORTRAIT_PRINT_MAX_MEMBERS;
  const mealRate = report.mealRate === null ? "—" : t.common.taka(f.amount(report.mealRate));
  const extraPerMember =
    report.extraCostPerMember === null ? "—" : t.common.taka(f.amount(report.extraCostPerMember));

  return (
    <article id={id} className={cn("report-sheet space-y-6 bg-background", printPortrait && "print-portrait")}>
      {printPortrait ? <style>{"@media print { @page { size: A4 portrait; margin: 0 10mm; } }"}</style> : null}
      <header className="text-center space-y-1">
        {hostelName ? <p className="text-base font-semibold text-primary">{hostelName}</p> : null}
        <h1 className="text-2xl sm:text-3xl font-bold">
          {r.title(f.period(report.month, report.year))}
        </h1>
        <p className="text-muted-foreground">
          {r.managerLabel} <span className="font-medium text-foreground">{report.managerName || "—"}</span>
        </p>
      </header>

      {/* Mobile: one card per member. Print and PDF (rendered at 1200px) always use the table. */}
      <div className="report-cards space-y-3 md:hidden print:hidden">
        <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{r.mealRate}</span>
            <span className="text-lg font-semibold text-primary tabular-nums">{mealRate}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{s.extraPerMember}</span>
            <span className="text-lg font-semibold text-primary tabular-nums">{extraPerMember}</span>
          </div>
        </div>

        {report.members.length === 0 ? (
          <p className="rounded-xl border px-3 py-8 text-center text-muted-foreground">
            {r.noMembers}
          </p>
        ) : (
          <ul className="space-y-3">
            {report.members.map((m) => (
              <li key={m.memberId} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-semibold">{m.name}</p>
                  <BalanceChip outstanding={m.outstandingBalance} refund={m.refundAmount} />
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <CardStat label={r.deposit} value={`৳ ${f.amount(m.investment)}`} />
                  <CardStat label={r.mealCount} value={f.meals(m.mealCount)} />
                  <CardStat label={r.totalCost} value={`৳ ${f.amount(m.totalCost)}`} strong />
                </dl>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl border bg-muted/60 p-3">
          <p className="font-semibold">{r.grandTotal}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <CardStat label={r.deposit} value={`৳ ${f.amount(report.totalDeposits)}`} />
            <CardStat label={r.mealCount} value={f.meals(report.totalMeals)} />
            <CardStat label={r.totalCost} value={`৳ ${f.amount(report.totalMemberCost)}`} strong />
            <CardStat
              label={r.due}
              value={`৳ ${f.amount(totalOutstanding)}`}
              className="text-red-600 dark:text-red-400"
            />
            <CardStat
              label={r.refund}
              value={`৳ ${f.amount(totalRefund)}`}
              className="text-emerald-700 dark:text-emerald-400"
            />
          </dl>
        </div>
      </div>

      <div className="print-table-wrap hidden overflow-x-auto rounded-xl border md:block print:block">
        <table className="w-full min-w-[760px] text-sm sm:text-base">
          <thead className="bg-muted/60">
            <tr>
              {r.columns.map((c, i) => (
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
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  {r.noMembers}
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
                  <td className="px-3 py-2.5 text-right tabular-nums">{f.amount(m.investment)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {f.meals(m.mealCount)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {f.amount(m.totalCost)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums",
                      m.outstandingBalance > 0
                        ? "font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {f.amount(m.outstandingBalance)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right tabular-nums",
                      m.refundAmount > 0
                        ? "font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {f.amount(m.refundAmount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-muted/60 font-semibold">
            <tr className="border-t">
              <th scope="row" className="px-3 py-3 text-left sticky left-0 bg-muted">
                {r.grandTotal}
              </th>
              <td className="px-3 py-3 text-right tabular-nums">{f.amount(report.totalDeposits)}</td>
              <td className="px-3 py-3 text-right tabular-nums">
                {f.meals(report.totalMeals)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">{f.amount(report.totalMemberCost)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-red-600">
                {f.amount(totalOutstanding)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-emerald-700">
                {f.amount(totalRefund)}
              </td>
            </tr>
            <tr className="border-t">
              <td colSpan={6} className="px-3 py-3 text-lg">
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
                  <span>
                    {r.mealRateColon} <span className="text-primary">{mealRate}</span>
                  </span>
                  <span>
                    {s.extraPerMember}: <span className="text-primary">{extraPerMember}</span>
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {showSummary ? (
        <section aria-labelledby="summary-heading" className="space-y-3">
          <h2 id="summary-heading" className="text-lg font-semibold">
            {r.summaryTitle}
          </h2>
          {previous !== undefined ? (
            <p className="text-sm text-muted-foreground">
              {previous ? r.compare.with(previousLabel) : r.compare.none}
            </p>
          ) : null}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3 lg:grid-cols-4">
            {summary.map(({ key, label, unit, trend }) => {
              const value = current[key];
              const before = previous?.[key] ?? null;
              return (
                <div key={key} className="bg-background p-3">
                  <dt className="text-xs sm:text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{value === null ? "—" : format(unit, value)}</dd>
                  {previous && value !== null && before !== null ? (
                    <dd>
                      <Change
                        delta={value - before}
                        trend={trend}
                        text={(d) => format(unit, d)}
                        title={r.compare.previous(previousLabel, format(unit, before))}
                      />
                    </dd>
                  ) : null}
                </div>
              );
            })}
          </dl>
        </section>
      ) : null}

      {generatedAt ? (
        <p className="text-center text-xs text-muted-foreground">
          {r.generatedAt(f.date(generatedAt))}
        </p>
      ) : null}
    </article>
  );
}

function CardStat({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-2">
      <dt className="truncate text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums whitespace-nowrap", strong ? "font-semibold" : "font-medium", className)}>
        {value}
      </dd>
    </div>
  );
}

/** Shows বকেয়া (red) or ফেরত (green); a settled member gets a neutral chip. */
function BalanceChip({ outstanding, refund }: { outstanding: number; refund: number }) {
  const { t, f } = useI18n();
  if (outstanding > 0) {
    return (
      <span className="shrink-0 rounded-md bg-red-50 px-2 py-0.5 text-sm font-semibold text-red-600 tabular-nums dark:bg-red-950/40 dark:text-red-400">
        {t.report.due} ৳ {f.amount(outstanding)}
      </span>
    );
  }
  if (refund > 0) {
    return (
      <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-700 tabular-nums dark:bg-emerald-950/40 dark:text-emerald-400">
        {t.report.refund} ৳ {f.amount(refund)}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">{t.report.settled}</span>
  );
}

type SummaryKey = Exclude<keyof SummaryMetrics, "month" | "year">;
type SummaryUnit = "taka" | "people" | "meals";
/** cost: an increase is bad (red); income: an increase is good; neutral: no colour. */
type SummaryTrend = "cost" | "income" | "neutral";
type SummaryItem = { key: SummaryKey; label: string; unit: SummaryUnit; trend: SummaryTrend };

/** ▲/▼ change against the previous month, coloured by whether the change is good or bad. */
function Change({
  delta,
  trend,
  text,
  title,
}: {
  delta: number;
  trend: SummaryTrend;
  text: (delta: number) => string;
  title: string;
}) {
  const { t } = useI18n();
  const c = t.report.compare;
  if (delta === 0) {
    return (
      <span title={title} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3.5" aria-hidden /> {c.same}
      </span>
    );
  }
  const up = delta > 0;
  const good = trend === "neutral" ? null : (trend === "income") === up;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      title={title}
      className={cn(
        "mt-1 inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        good === null && "text-muted-foreground",
        good === true && "text-primary",
        good === false && "text-red-600 dark:text-red-400",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {up ? c.up(text(delta)) : c.down(text(-delta))}
    </span>
  );
}
