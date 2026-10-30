import type { Metadata } from "next";
import { connection } from "next/server";
import { PublicReportPage } from "@/components/report/public-report-page";
import { getPublicReport } from "@/services/public-report-service";

export const metadata: Metadata = { title: "মাসিক হিসাব" };

export default async function HostelReportPage({ params }: PageProps<"/monthly-bill/[hostel]">) {
  // Always read fresh data so a newly published month appears immediately.
  await connection();
  const { hostel } = await params;
  const data = await getPublicReport(hostel);
  return <PublicReportPage data={data} />;
}
