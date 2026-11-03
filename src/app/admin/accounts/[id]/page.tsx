import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/admin/page-header";
import { AccountEditor } from "@/features/accounting/account-editor";
import { PublishedAccountView } from "@/features/accounting/published-account-view";
import { requireAdminPage } from "@/lib/authz";
import { getI18n } from "@/i18n/server";
import { summaryMetrics } from "@/features/accounting/report-data";
import { getAccountById, getPreviousPublishedAccount } from "@/services/accounting-service";
import { listMembers } from "@/services/member-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.accounts.metaTitle };
}

export default async function AccountPage({ params }: PageProps<"/admin/accounts/[id]">) {
  const { hostel } = await requireAdminPage();
  const { id } = await params;
  const [account, registry] = await Promise.all([
    getAccountById(hostel.id, id),
    listMembers(hostel.id),
  ]);
  if (!account) notFound();
  const [{ t, f }, previousAccount] = await Promise.all([
    getI18n(),
    getPreviousPublishedAccount(hostel.id, account.month, account.year),
  ]);
  const previous = previousAccount ? summaryMetrics(previousAccount) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {t.accounts.recordTitle(f.period(account.month, account.year))}
            <StatusBadge status={account.status} />
          </span>
        }
        description={
          account.status === "DRAFT"
            ? t.accounts.draftDescription
            : undefined
        }
      />
      {account.status === "PUBLISHED" ? (
        <PublishedAccountView
          account={account}
          hostelName={hostel.name}
          hostelCode={hostel.code}
          previous={previous}
        />
      ) : (
        <AccountEditor
          key={account.updatedAt}
          mode={{ kind: "edit", account }}
          registry={registry}
          hostelName={hostel.name}
          previous={previous}
        />
      )}
    </div>
  );
}
