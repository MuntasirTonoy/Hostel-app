"use client";

import { Languages, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setLocaleAction } from "@/i18n/actions";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Switches the UI between Bangla and English (saved in a cookie). */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "bn" ? "en" : "bn";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("no-print gap-1.5 px-2.5", className)}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocaleAction(next);
          router.refresh();
        })
      }
      aria-label={`${t.common.changeLanguage}: ${t.common.switchTo}`}
      title={t.common.changeLanguage}
      lang={next}
    >
      {pending ? <Loader2 className="animate-spin" /> : <Languages />}
      <span className="sm:hidden">{t.common.switchToShort}</span>
      <span className="hidden sm:inline">{t.common.switchTo}</span>
    </Button>
  );
}
