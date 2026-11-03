"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

const BANGLA = /[ঀ-৿]/;

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  const { t, tm } = useI18n();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-xl font-semibold">{t.admin.errorTitle}</h1>
      <p className="text-muted-foreground">
        {/* Our own (Bangla) messages are safe to show; anything else gets a generic text. */}
        {BANGLA.test(error.message ?? "") ? tm(error.message) : t.admin.errorFallback}
      </p>
      <Button onClick={reset}>{t.common.retry}</Button>
    </div>
  );
}
