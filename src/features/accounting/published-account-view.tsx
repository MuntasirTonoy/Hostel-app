import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ReportView } from "@/components/report/report-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatBanglaDate, periodLabel, periodSlug } from "@/lib/months";
import type { MonthlyAccountDTO } from "@/types/accounting";
import { AccountActions } from "./account-actions";

/** Read-only view of a finalized report with confirmed unpublish and delete actions. */
export function PublishedAccountView({
  account,
  hostelName,
  hostelCode,
}: {
  account: MonthlyAccountDTO;
  hostelName: string;
  hostelCode: string;
}) {
  return (
    <div className="space-y-6">
      <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200">
        <AlertTitle>এই হিসাবটি প্রকাশিত ও চূড়ান্ত</AlertTitle>
        <AlertDescription className="text-orange-800 dark:text-orange-300">
          {account.publishedAt ? `প্রকাশের তারিখ: ${formatBanglaDate(new Date(account.publishedAt))}। ` : ""}
          পরিবর্তন করতে হলে আগে অপ্রকাশিত করুন।
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={`/monthly-bill/${hostelCode}/${periodSlug(account.month, account.year)}`} target="_blank">
            <ExternalLink /> পাবলিক পাতায় দেখুন
          </Link>
        </Button>
        <AccountActions
          id={account.id}
          status={account.status}
          label={periodLabel(account.month, account.year)}
          afterDelete="list"
        />
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <ReportView report={account} hostelName={hostelName} />
      </div>
    </div>
  );
}
