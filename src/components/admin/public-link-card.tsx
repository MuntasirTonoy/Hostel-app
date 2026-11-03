"use client";

import { Copy, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/** Shows the hostel's shareable public report link with a copy button. */
export function PublicLinkCard({ code, baseUrl }: { code: string; baseUrl: string }) {
  const { t } = useI18n();
  const path = `/monthly-bill/${code}`;
  // Prefer the configured domain (APP_URL); otherwise fall back to the browser origin.
  const origin = useSyncExternalStore(
    () => () => {},
    () => baseUrl || window.location.origin,
    () => baseUrl,
  );
  const url = `${origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.publicLink.copied);
    } catch {
      toast.error(t.publicLink.copyFailed);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4" /> {t.publicLink.label} <b className="font-mono">{code}</b>)
        </p>
        <p className="truncate font-mono text-sm">{url}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          <Copy /> {t.publicLink.copy}
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={path} target="_blank">
            <ExternalLink /> {t.publicLink.open}
          </Link>
        </Button>
      </div>
    </div>
  );
}
