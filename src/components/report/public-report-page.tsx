import { CalendarDays, FileX2 } from "lucide-react";
import Link from "next/link";
import { periodLabel, periodSlug } from "@/lib/months";
import { cn } from "@/lib/utils";
import type { PublicReportData } from "@/services/public-report-service";
import { ReportActions } from "./report-actions";
import { ReportView } from "./report-view";

export function PublicReportPage({
  data,
  notFoundMessage = "বর্তমানে কোনো মাসের হিসাব প্রকাশ করা হয়নি।",
}: {
  data: PublicReportData;
  notFoundMessage?: string;
}) {
  const { hostel, report, periods } = data;

  if (!hostel) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileX2 className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">হোস্টেল খুঁজে পাওয়া যায়নি</h1>
          <p className="text-muted-foreground">লিংক বা হোস্টেল কোডটি সঠিক কিনা যাচাই করুন।</p>
          <Link href="/monthly-bill" className="text-primary underline underline-offset-4">
            অন্য কোড দিয়ে খুঁজুন
          </Link>
        </div>
      </main>
    );
  }

  const base = `/monthly-bill/${hostel.code}`;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-6 sm:py-10">
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
          <h1 className="text-xl font-semibold">মাসিক হিসাব</h1>
          <p className="text-muted-foreground">{notFoundMessage}</p>
        </div>
      )}

      {periods.length > 0 ? (
        <section className="no-print space-y-3" aria-labelledby="previous-reports">
          <h2 id="previous-reports" className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5" /> পূর্ববর্তী মাসের হিসাব
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
                    {periodLabel(p.month, p.year)}
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
