"use client";

import { CheckCircle2, Link2, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/features/accounting/confirm-button";
import { useI18n } from "@/i18n/client";
import { hostelIdSchema } from "@/schemas/auth";
import { checkHostelIdAvailableAction, updateHostelIdAction } from "./actions";

type IdStatus = "checking" | "available" | "taken" | "invalid";

/**
 * Changes the hostel's public Hostel ID (used in /monthly-bill/<id>). The new ID is
 * checked for availability while typing; saving asks for confirmation because
 * the old link stops working.
 */
export function HostelIdForm({ code, baseUrl }: { code: string; baseUrl: string }) {
  const router = useRouter();
  const { t, tm } = useI18n();
  const h = t.profile.hostelId;
  const [value, setValue] = useState(code);
  const [saving, startSaving] = useTransition();

  const parsed = hostelIdSchema.safeParse(value);
  const newId = parsed.success ? parsed.data : value.trim().toLowerCase();
  const changed = newId !== code;

  // Result of the last server availability check, keyed by the ID it was for.
  const [check, setCheck] = useState<{ id: string; available: boolean } | null>(null);
  const status: IdStatus | null = !changed
    ? null
    : !parsed.success
      ? "invalid"
      : check?.id === newId
        ? check.available
          ? "available"
          : "taken"
        : "checking";

  useEffect(() => {
    if (!changed || !parsed.success) return;
    let cancelled = false;
    // Debounce so we only check once typing pauses.
    const timer = setTimeout(async () => {
      const result = await checkHostelIdAvailableAction(newId);
      if (cancelled) return;
      if (!result.ok) return void toast.error(result.error);
      setCheck({ id: newId, available: result.data.available });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newId, changed, parsed.success]);

  // Prefer the configured domain (APP_URL); otherwise fall back to the browser origin.
  const origin = useSyncExternalStore(
    () => () => {},
    () => baseUrl || window.location.origin,
    () => baseUrl,
  );

  function save() {
    if (status !== "available") {
      toast.error(status === "taken" ? h.taken : h.wait);
      return;
    }
    startSaving(async () => {
      const result = await updateHostelIdAction({ code: newId });
      if (!result.ok) return void toast.error(result.error);
      toast.success(h.saved);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{h.title}</CardTitle>
        <CardDescription>{h.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="hostel-id">{h.label}</Label>
            <Input
              id="hostel-id"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="font-mono"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={40}
              aria-invalid={status === "taken" || status === "invalid"}
              aria-describedby="hostel-id-status"
            />
            <div id="hostel-id-status" aria-live="polite" className="space-y-1 text-sm">
              {status === "checking" ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> {h.checking}
                </span>
              ) : status === "available" ? (
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-3.5" /> {h.available}
                </span>
              ) : status === "taken" ? (
                <span className="flex items-center gap-1.5 text-red-600">
                  <XCircle className="size-3.5" /> {h.taken}
                </span>
              ) : status === "invalid" && !parsed.success ? (
                <span className="text-red-600">{tm(parsed.error.issues[0]?.message)}</span>
              ) : null}
              {status === "available" ? (
                <p className="flex items-center gap-1.5 break-all text-muted-foreground">
                  <Link2 className="size-3.5 shrink-0" />
                  <span className="font-mono">{h.newLink(`${origin}/monthly-bill/${newId}`)}</span>
                </p>
              ) : null}
            </div>
          </div>
          <ConfirmAction
            title={h.confirmTitle}
            description={<p>{h.confirmDescription(code, newId)}</p>}
            confirmLabel={h.confirm}
            onConfirm={save}
            trigger={
              <Button type="button" disabled={saving || status !== "available"}>
                {saving ? <Loader2 className="animate-spin" /> : <Link2 />} {h.submit}
              </Button>
            }
          />
        </form>
      </CardContent>
    </Card>
  );
}
