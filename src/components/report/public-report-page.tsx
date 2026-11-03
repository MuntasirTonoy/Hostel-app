import { CalendarDays, FileX2 } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { getI18n } from "@/i18n/server";
import { periodSlug } from "@/lib/months";
import { cn } from "@/lib/utils";
import type { PublicReportData } from "@/services/public-report-service";
import { ReportActions } from "./report-actions";
import { ReportView } from "./report-view";

export async function PublicReportPage({
  data,
  notFoundMessage,
}: {
  data: PublicReportData;
  notFoundMessage?: string;
}) {
  const { hostel, report, periods } = data;
  const { t, f } = await getI18n();
  // This page has no site header, so it gets its own language and theme switches.
  const toolbar = (
    <div className="no-print flex justify-end gap-2">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  );

  if (!hostel) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-4 py-6 sm:py-10">
        {toolbar}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileX2 className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t.publicReport.hostelNotFound}</h1>
          <p className="text-muted-foreground">{t.publicReport.checkLink}</p>
          <Link href="/monthly-bill" className="text-primary underline underline-offset-4">
            {t.publicReport.searchAnother}
          </Link>
        </div>
      </main>
    );
  }

  const base = `/monthly-bill/${hostel.code}`;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-6 sm:py-10">
      {toolbar}
      {report ? (
        <>
          <ReportView id="monthly-bill" report={report} hostelName={hostel.name} generatedAt={new Date()} showSummary={false} />
          <ReportActions
            targetId="monthly-bill"
            fileName={`${hostel.code}-${periodSlug(report.month, report.year)}`}
            basePath={base}
            periods={periods}
            current={{ month: report.month, year: report.year }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileX2 className="size-10 text-muted-foreground" />
          <p className="font-semibold text-primary">{hostel.name}</p>
          <h1 className="text-xl font-semibold">{t.nav.monthlyBill}</h1>
          <p className="text-muted-foreground">{notFoundMessage ?? t.publicReport.noneYet}</p>
        </div>
      )}

      {periods.length > 0 ? (
        <section className="no-print space-y-3" aria-labelledby="previous-reports">
          <h2 id="previous-reports" className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5" /> {t.publicReport.previous}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {periods.map((p) => {
              const active = report && report.month === p.month && report.year === p.year;
              return (
                <li key={p.id}>
                  <Link
                    href={`${base}/${periodSlug(p.month, p.year)}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-block rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-muted",
                      active && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {f.period(p.month, p.year)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
