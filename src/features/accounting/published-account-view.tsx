import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ReportView } from "@/components/report/report-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { periodSlug } from "@/lib/months";
import type { MonthlyAccountDTO } from "@/types/accounting";
import { AccountActions } from "./account-actions";
import type { SummaryMetrics } from "./report-data";

/** Read-only view of a finalized report with confirmed unpublish and delete actions. */
export async function PublishedAccountView({
  account,
  hostelName,
  hostelCode,
  previous,
}: {
  account: MonthlyAccountDTO;
  hostelName: string;
  hostelCode: string;
  previous: SummaryMetrics | null;
}) {
  const { t, f } = await getI18n();
  return (
    <div className="space-y-6">
      <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
        <AlertTitle>{t.published.title}</AlertTitle>
        <AlertDescription className="text-orange-800 dark:text-orange-300">
          {account.publishedAt ? t.published.publishedAt(f.date(new Date(account.publishedAt))) : ""}
          {t.published.editHint}
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={`/monthly-bill/${hostelCode}/${periodSlug(account.month, account.year)}`} target="_blank">
            <ExternalLink /> {t.published.viewPublic}
          </Link>
        </Button>
        <AccountActions
          id={account.id}
          status={account.status}
          label={f.period(account.month, account.year)}
          afterDelete="list"
        />
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <ReportView report={account} hostelName={hostelName} previous={previous} />
      </div>
    </div>
  );
}
