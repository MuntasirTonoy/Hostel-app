import { parsePeriodSlug } from "@/lib/months";
import type { MonthlyAccountDTO, PeriodRef } from "@/types/accounting";
import {
  getAccountByPeriod,
  getLatestPublishedAccount,
  listPublishedPeriods,
} from "./accounting-service";
import { getHostelByCode, type HostelDTO } from "./hostel-service";

export interface PublicReportData {
  /** null when no hostel has this Hostel ID (code). */
  hostel: Pick<HostelDTO, "code" | "name"> | null;
  report: MonthlyAccountDTO | null;
  periods: PeriodRef[];
}

/**
 * Data for a hostel's public report page. Only PUBLISHED records of that hostel
 * are ever returned: with no slug the latest published period is shown,
 * otherwise the requested period (or null when missing or still a draft).
 */
export async function getPublicReport(code: string, slug?: string): Promise<PublicReportData> {
  const hostel = await getHostelByCode(code);
  if (!hostel) return { hostel: null, report: null, periods: [] };

  let report: MonthlyAccountDTO | null;
  if (slug === undefined) {
    report = await getLatestPublishedAccount(hostel.id);
  } else {
    const period = parsePeriodSlug(slug);
    report = period
      ? await getAccountByPeriod(hostel.id, period.month, period.year, { publishedOnly: true })
      : null;
  }
  const periods = await listPublishedPeriods(hostel.id);
  return { hostel: { code: hostel.code, name: hostel.name }, report, periods };
}
