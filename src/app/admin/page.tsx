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
import { formatAmount, formatMealUnits, formatTaka, mealCountToUnits, toBanglaDigits } from "@/lib/money";
import { currentPeriod, periodLabel } from "@/lib/months";
import { getAccountByPeriod } from "@/services/accounting-service";
import { countActiveMembers } from "@/services/member-service";

export default async function DashboardPage() {
  const { hostel } = await requireAdminPage();
  const { month, year } = currentPeriod();
  const [current, activeMembers] = await Promise.all([
    getAccountByPeriod(hostel.id, month, year),
    countActiveMembers(hostel.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            ড্যাশবোর্ড — {periodLabel(month, year)}
            {current ? <StatusBadge status={current.status} /> : null}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/monthly-bill/${hostel.code}`} target="_blank">
                <ExternalLink /> প্রকাশিত হিসাব
              </Link>
            </Button>
            {current ? (
              <Button asChild>
                <Link href={`/admin/accounts/${current.id}`}>
                  <Calculator /> চলতি মাসের হিসাব খুলুন
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
            label="মোট সদস্য"
            value={`${toBanglaDigits(current.totalMembers)} জন`}
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="মোট মিল"
            value={`${formatMealUnits(mealCountToUnits(current.totalMeals))}টি`}
            icon={<Utensils className="size-4" />}
          />
          <StatCard
            label="মোট জমা"
            value={formatTaka(current.totalDeposits)}
            icon={<Wallet className="size-4" />}
          />
          <StatCard
            label="বাজার খরচ"
            value={formatTaka(current.expenses.marketExpense)}
            icon={<ShoppingBasket className="size-4" />}
          />
          <StatCard
            label="চালের খরচ"
            value={formatTaka(current.expenses.riceExpense)}
            icon={<Wheat className="size-4" />}
          />
          <StatCard
            label="মোট অতিরিক্ত খরচ"
            value={formatTaka(current.totalExtraCost)}
            icon={<Flame className="size-4" />}
          />
          <StatCard
            label="মিল রেট"
            value={current.mealRate === null ? "—" : `${formatAmount(current.mealRate)} টাকা`}
            icon={<Calculator className="size-4" />}
            highlight
          />
          <StatCard
            label="মোট খরচ"
            value={formatTaka(current.totalMemberCost)}
            icon={<CircleDollarSign className="size-4" />}
            highlight
          />
        </div>
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-12 text-center">
          <FilePlus2 className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">এই মাসের হিসাব এখনো তৈরি হয়নি</h2>
          <p className="text-muted-foreground">
            সক্রিয় সদস্য: {toBanglaDigits(activeMembers)} জন। পূর্ববর্তী মাসের সদস্যরা স্বয়ংক্রিয়ভাবে
            যুক্ত হবে।
          </p>
          <Button asChild size="lg">
            <Link href={`/admin/accounts/new?month=${month}&year=${year}`}>
              <FilePlus2 /> নতুন মাসের হিসাব তৈরি করুন
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
