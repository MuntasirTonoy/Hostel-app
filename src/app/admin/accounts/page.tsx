import { FilePlus2, Files } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { AccountActions } from "@/features/accounting/account-actions";
import { requireAdminPage } from "@/lib/authz";
import { formatAmount, formatMealUnits, mealCountToUnits, toBanglaDigits } from "@/lib/money";
import { periodLabel } from "@/lib/months";
import { listAccounts } from "@/services/accounting-service";

export const metadata: Metadata = { title: "মাসিক হিসাবসমূহ" };

export default async function AccountsPage() {
  const { hostel } = await requireAdminPage();
  const accounts = await listAccounts(hostel.id);

  return (
    <div>
      <PageHeader
        title="মাসিক হিসাবসমূহ"
        description="সকল খসড়া ও প্রকাশিত মাসিক হিসাব"
        actions={
          <Button asChild>
            <Link href="/admin/accounts/new">
              <FilePlus2 /> নতুন মাসের হিসাব তৈরি করুন
            </Link>
          </Button>
        }
      />
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card py-14 text-center">
          <Files className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">এখনো কোনো মাসিক হিসাব তৈরি করা হয়নি।</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">মাস</th>
                <th className="px-4 py-3 font-semibold">ম্যানেজার</th>
                <th className="px-4 py-3 text-right font-semibold">সদস্য</th>
                <th className="px-4 py-3 text-right font-semibold">মোট মিল</th>
                <th className="px-4 py-3 text-right font-semibold">মিল রেট (৳)</th>
                <th className="px-4 py-3 text-right font-semibold">মোট খরচ (৳)</th>
                <th className="px-4 py-3 font-semibold">অবস্থা</th>
                <th className="px-4 py-3">
                  <span className="sr-only">কার্যক্রম</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/accounts/${a.id}`} className="text-primary hover:underline">
                      {periodLabel(a.month, a.year)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{a.managerName || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{toBanglaDigits(a.totalMembers)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatMealUnits(mealCountToUnits(a.totalMeals))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {a.mealRate === null ? "—" : formatAmount(a.mealRate)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatAmount(a.totalMemberCost)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-end">
                      <AccountActions
                        compact
                        id={a.id}
                        status={a.status}
                        label={periodLabel(a.month, a.year)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
