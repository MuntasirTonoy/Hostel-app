import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { AccountEditor } from "@/features/accounting/account-editor";
import { requireAdminPage } from "@/lib/authz";
import { currentPeriod } from "@/lib/months";
import { getAccountByPeriod, getCarryForwardMembers } from "@/services/accounting-service";
import { listMembers } from "@/services/member-service";

export const metadata: Metadata = { title: "নতুন মাসের হিসাব" };

/** The full entry form, pre-filled with the previous month's members. */
export default async function NewAccountPage({ searchParams }: PageProps<"/admin/accounts/new">) {
  const { hostel } = await requireAdminPage();
  const params = await searchParams;
  const now = currentPeriod();
  const m = Number(params.month);
  const y = Number(params.year);
  const month = m >= 1 && m <= 12 ? m : now.month;
  const year = y >= 2000 && y <= 2100 ? y : now.year;

  const [registry, carryForward, existing] = await Promise.all([
    listMembers(hostel.id),
    getCarryForwardMembers(hostel.id, month, year),
    getAccountByPeriod(hostel.id, month, year),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="নতুন মাসের হিসাব"
        description="জমা, মিল ও খরচ লিখুন। সব হিসাব স্বয়ংক্রিয়ভাবে হালনাগাদ হবে। সংরক্ষণ করলে খসড়া থাকবে, প্রকাশ হবে না।"
      />
      <AccountEditor
        mode={{ kind: "create", month, year, carryForward, existingId: existing?.id ?? null }}
        registry={registry}
        hostelName={hostel.name}
      />
    </div>
  );
}
