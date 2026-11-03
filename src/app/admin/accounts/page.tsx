import { FilePlus2, Files } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { AccountActions } from "@/features/accounting/account-actions";
import { requireAdminPage } from "@/lib/authz";
import { getI18n } from "@/i18n/server";
import { listAccounts } from "@/services/accounting-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.accounts.title };
}

export default async function AccountsPage() {
  const { hostel } = await requireAdminPage();
  const [accounts, { t, f }] = await Promise.all([listAccounts(hostel.id), getI18n()]);
  const L = t.accounts;

  return (
    <div>
      <PageHeader
        title={L.title}
        description={L.description}
        actions={
          <Button asChild>
            <Link href="/admin/accounts/new">
              <FilePlus2 /> {L.createNew}
            </Link>
          </Button>
        }
      />
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card py-14 text-center">
          <Files className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">{L.empty}</p>
        </div>
      ) : (
        <>
          {/* Mobile: one card per month */}
          <ul className="grid gap-3 md:hidden">
            {accounts.map((a) => (
              <li key={a.id} className="rounded-xl border bg-card p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/accounts/${a.id}`}
                      className="block truncate text-base font-semibold text-primary hover:underline"
                    >
                      {f.period(a.month, a.year)}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.common.manager(a.managerName || "—")}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {[
                    [L.members, f.num(a.totalMembers)],
                    [L.totalMeals, f.meals(a.totalMeals)],
                    [L.mealRate, a.mealRate === null ? "—" : `৳ ${f.amount(a.mealRate)}`],
                    [L.totalCost, `৳ ${f.amount(a.totalMemberCost)}`],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-lg bg-muted/50 px-3 py-2">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="truncate font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/accounts/${a.id}`}>{L.viewDetails}</Link>
                  </Button>
                  <AccountActions compact id={a.id} status={a.status} label={f.period(a.month, a.year)} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">{L.columns.month}</th>
                  <th className="px-4 py-3 font-semibold">{L.columns.manager}</th>
                  <th className="px-4 py-3 text-right font-semibold">{L.columns.members}</th>
                  <th className="px-4 py-3 text-right font-semibold">{L.columns.totalMeals}</th>
                  <th className="px-4 py-3 text-right font-semibold">{L.columns.mealRate}</th>
                  <th className="px-4 py-3 text-right font-semibold">{L.columns.totalCost}</th>
                  <th className="px-4 py-3 font-semibold">{L.columns.status}</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">{L.columns.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/accounts/${a.id}`} className="text-primary hover:underline">
                        {f.period(a.month, a.year)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{a.managerName || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.num(a.totalMembers)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {f.meals(a.totalMeals)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {a.mealRate === null ? "—" : f.amount(a.mealRate)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{f.amount(a.totalMemberCost)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end">
                        <AccountActions
                          compact
                          id={a.id}
                          status={a.status}
                          label={f.period(a.month, a.year)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
