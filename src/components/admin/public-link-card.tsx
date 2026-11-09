"use client";

import { Copy, ExternalLink, Link2, Share2 } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/i18n/client";

/** Shows a public link of the hostel; Share opens a modal with its QR code and a copy button. */
export function PublicLinkCard({
  code,
  baseUrl,
  kind = "report",
}: {
  code: string;
  baseUrl: string;
  kind?: "report" | "contacts";
}) {
  const { t } = useI18n();
  const text = kind === "contacts" ? t.publicLink.contacts : t.publicLink;
  const path = kind === "contacts" ? `/contacts/${code}` : `/monthly-bill/${code}`;
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
          <Link2 className="size-4" /> {text.label} <b className="font-mono">{code}</b>)
        </p>
        <p className="truncate font-mono text-sm">{url}</p>
      </div>
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Share2 /> {t.publicLink.share}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{text.shareTitle}</DialogTitle>
              <DialogDescription>{text.shareDescription}</DialogDescription>
            </DialogHeader>
            {/* Always dark-on-white with a quiet zone, so it scans in the dark theme too. */}
            <div className="justify-self-center rounded-lg bg-white p-3">
              <QRCodeSVG value={url} size={200} title={text.qrTitle} />
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
              <p className="min-w-0 flex-1 font-mono text-sm break-all select-all">{url}</p>
              <Button type="button" size="sm" onClick={copy}>
                <Copy /> {t.publicLink.copy}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button asChild size="sm" variant="outline">
          <Link href={path} target="_blank">
            <ExternalLink /> {t.publicLink.open}
          </Link>
        </Button>
      </div>
    </div>
  );
}
