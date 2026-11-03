import {
  Calculator,
  CircleDollarSign,
  ExternalLink,
  FilePlus2,
  Flame,
  ShoppingBasket,
  Users,
  Utensils,
  Wallet,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { PageHeader, StatCard, StatusBadge } from "@/components/admin/page-header";
import { PublicLinkCard } from "@/components/admin/public-link-card";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/authz";
import { getAppUrl } from "@/lib/site";
import { getI18n } from "@/i18n/server";
import { currentPeriod } from "@/lib/months";
import { getAccountByPeriod } from "@/services/accounting-service";
import { countActiveMembers } from "@/services/member-service";

export default async function DashboardPage() {
  const { hostel } = await requireAdminPage();
  const { month, year } = currentPeriod();
  const { t, f } = await getI18n();
  const d = t.dashboard;
  const [current, activeMembers] = await Promise.all([
    getAccountByPeriod(hostel.id, month, year),
    countActiveMembers(hostel.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {d.title(f.period(month, year))}
            {current ? <StatusBadge status={current.status} /> : null}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/monthly-bill/${hostel.code}`} target="_blank">
                <ExternalLink /> {d.publishedReport}
              </Link>
            </Button>
            {current ? (
              <Button asChild>
                <Link href={`/admin/accounts/${current.id}`}>
                  <Calculator /> {d.openCurrent}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <PublicLinkCard code={hostel.code} baseUrl={getAppUrl()} />

      {current ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={d.stats.totalMembers}
            value={t.common.people(f.num(current.totalMembers))}
            icon={<Users className="size-4" />}
          />
          <StatCard
            label={d.stats.totalMeals}
            value={t.common.meals(f.meals(current.totalMeals))}
            icon={<Utensils className="size-4" />}
          />
          <StatCard
            label={d.stats.totalDeposits}
            value={f.taka(current.totalDeposits)}
            icon={<Wallet className="size-4" />}
          />
          <StatCard
            label={d.stats.market}
            value={f.taka(current.expenses.marketExpense)}
            icon={<ShoppingBasket className="size-4" />}
          />
          <StatCard
            label={d.stats.rice}
            value={f.taka(current.expenses.riceExpense)}
            icon={<Wheat className="size-4" />}
          />
          <StatCard
            label={d.stats.totalExtra}
            value={f.taka(current.totalExtraCost)}
            icon={<Flame className="size-4" />}
          />
          <StatCard
            label={d.stats.mealRate}
            value={current.mealRate === null ? "—" : t.common.taka(f.amount(current.mealRate))}
            icon={<Calculator className="size-4" />}
            highlight
          />
          <StatCard
            label={d.stats.totalCost}
            value={f.taka(current.totalMemberCost)}
            icon={<CircleDollarSign className="size-4" />}
            highlight
          />
        </div>
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-12 text-center">
          <FilePlus2 className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{d.notCreated}</h2>
          <p className="text-muted-foreground">{d.activeInfo(f.num(activeMembers))}</p>
          <Button asChild size="lg">
            <Link href={`/admin/accounts/new?month=${month}&year=${year}`}>
              <FilePlus2 /> {d.createNew}
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
