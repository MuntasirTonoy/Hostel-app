import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicReportPage } from "@/components/report/public-report-page";
import { parsePeriodSlug, periodLabel } from "@/lib/months";
import { getPublicReport } from "@/services/public-report-service";

export async function generateMetadata({
  params,
}: PageProps<"/monthly-bill/[hostel]/[period]">): Promise<Metadata> {
  const period = parsePeriodSlug((await params).period);
  return { title: period ? `মাসিক হিসাব — ${periodLabel(period.month, period.year)}` : "মাসিক হিসাব" };
}

export default async function HostelReportByPeriodPage({
  params,
}: PageProps<"/monthly-bill/[hostel]/[period]">) {
  await connection();
  const { hostel, period } = await params;
  const data = await getPublicReport(hostel, period);
  return <PublicReportPage data={data} notFoundMessage="এই মাসের কোনো প্রকাশিত হিসাব পাওয়া যায়নি।" />;
}
