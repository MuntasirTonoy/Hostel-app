import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { AccountEditor } from "@/features/accounting/account-editor";
import { getI18n } from "@/i18n/server";
import { requireAdminPage } from "@/lib/authz";
import { currentPeriod } from "@/lib/months";
import { summaryMetrics } from "@/features/accounting/report-data";
import {
  getAccountByPeriod,
  getCarryForwardMembers,
  getPreviousPublishedAccount,
} from "@/services/accounting-service";
import { listMembers } from "@/services/member-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.accounts.newTitle };
}

/** The full entry form, pre-filled with the previous month's members. */
export default async function NewAccountPage({ searchParams }: PageProps<"/admin/accounts/new">) {
  const { hostel } = await requireAdminPage();
  const params = await searchParams;
  const now = currentPeriod();
  const m = Number(params.month);
  const y = Number(params.year);
  const month = m >= 1 && m <= 12 ? m : now.month;
  const year = y >= 2000 && y <= 2100 ? y : now.year;

  const { t } = await getI18n();
  const [registry, carryForward, existing, previous] = await Promise.all([
    listMembers(hostel.id),
    getCarryForwardMembers(hostel.id, month, year),
    getAccountByPeriod(hostel.id, month, year),
    getPreviousPublishedAccount(hostel.id, month, year),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t.accounts.newTitle}
        description={t.accounts.draftDescription}
      />
      <AccountEditor
        mode={{ kind: "create", month, year, carryForward, existingId: existing?.id ?? null }}
        registry={registry}
        hostelName={hostel.name}
        previous={previous ? summaryMetrics(previous) : null}
      />
    </div>
  );
}
