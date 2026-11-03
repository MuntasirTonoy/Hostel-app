import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicReportPage } from "@/components/report/public-report-page";
import { getI18n } from "@/i18n/server";
import { parsePeriodSlug } from "@/lib/months";
import { getPublicReport } from "@/services/public-report-service";

export async function generateMetadata({
  params,
}: PageProps<"/monthly-bill/[hostel]/[period]">): Promise<Metadata> {
  const { t, f } = await getI18n();
  const period = parsePeriodSlug((await params).period);
  return { title: period ? t.report.title(f.period(period.month, period.year)) : t.nav.monthlyBill };
}

export default async function HostelReportByPeriodPage({
  params,
}: PageProps<"/monthly-bill/[hostel]/[period]">) {
  await connection();
  const { hostel, period } = await params;
  const [data, { t }] = await Promise.all([getPublicReport(hostel, period), getI18n()]);
  return <PublicReportPage data={data} notFoundMessage={t.publicReport.noneForMonth} />;
}
