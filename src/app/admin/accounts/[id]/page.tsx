import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/admin/page-header";
import { AccountEditor } from "@/features/accounting/account-editor";
import { PublishedAccountView } from "@/features/accounting/published-account-view";
import { requireAdminPage } from "@/lib/authz";
import { periodLabel } from "@/lib/months";
import { getAccountById } from "@/services/accounting-service";
import { listMembers } from "@/services/member-service";

export const metadata: Metadata = { title: "মাসিক হিসাব" };

export default async function AccountPage({ params }: PageProps<"/admin/accounts/[id]">) {
  const { hostel } = await requireAdminPage();
  const { id } = await params;
  const [account, registry] = await Promise.all([
    getAccountById(hostel.id, id),
    listMembers(hostel.id),
  ]);
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            মাসিক হিসাব — {periodLabel(account.month, account.year)}
            <StatusBadge status={account.status} />
          </span>
        }
        description={
          account.status === "DRAFT"
            ? "জমা, মিল ও খরচ লিখুন। সব হিসাব স্বয়ংক্রিয়ভাবে হালনাগাদ হবে। সংরক্ষণ করলে খসড়া থাকবে, প্রকাশ হবে না।"
            : undefined
        }
      />
      {account.status === "PUBLISHED" ? (
        <PublishedAccountView account={account} hostelName={hostel.name} hostelCode={hostel.code} />
      ) : (
        <AccountEditor
          key={account.updatedAt}
          account={account}
          registry={registry}
          hostelName={hostel.name}
        />
      )}
    </div>
  );
}
