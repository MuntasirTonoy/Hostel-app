"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function ReportError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">{t.publicReport.loadErrorTitle}</h1>
      <p className="text-muted-foreground">{t.publicReport.loadErrorText}</p>
      <Button onClick={reset}>{t.common.retry}</Button>
    </main>
  );
}
