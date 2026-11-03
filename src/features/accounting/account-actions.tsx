"use client";

import { Loader2, LockOpen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import type { AccountStatus } from "@/types/accounting";
import { deleteAccountAction, unpublishAccountAction } from "./actions";
import { ConfirmAction } from "./confirm-button";

/**
 * Unpublish (published only) and delete buttons for a monthly record, each
 * behind a confirmation dialog. `compact` renders icon-only buttons for tables.
 */
export function AccountActions({
  id,
  status,
  label,
  compact = false,
  afterDelete = "refresh",
}: {
  id: string;
  status: AccountStatus;
  /** The localized period, e.g. "অক্টোবর ২০২৬" — shown in the confirmation text. */
  label: string;
  compact?: boolean;
  afterDelete?: "refresh" | "list";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();
  const A = t.accountActions;

  function unpublish() {
    startTransition(async () => {
      const result = await unpublishAccountAction(id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(A.unpublished(label));
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteAccountAction(id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(A.deleted(label));
      if (afterDelete === "list") router.push("/admin/accounts");
      else router.refresh();
    });
  }

  const size = compact ? "icon" : "default";

  return (
    <div className="flex items-center gap-1">
      {pending && compact ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      {status === "PUBLISHED" ? (
        <ConfirmAction
          title={A.unpublishTitle}
          description={<p>{A.unpublishDescription(label)}</p>}
          confirmLabel={A.unpublish}
          onConfirm={unpublish}
          trigger={
            <Button
              variant="outline"
              size={size}
              disabled={pending}
              aria-label={A.unpublish}
              title={A.unpublish}
            >
              {pending && !compact ? <Loader2 className="animate-spin" /> : <LockOpen />}
              {compact ? null : A.unpublish}
            </Button>
          }
        />
      ) : null}
      <ConfirmAction
        destructive
        title={A.deleteTitle}
        description={<p>{A.deleteDescription(label, status === "PUBLISHED")}</p>}
        confirmLabel={A.delete}
        onConfirm={remove}
        trigger={
          <Button
            variant={compact ? "ghost" : "destructive"}
            size={size}
            disabled={pending}
            className={compact ? "text-muted-foreground hover:text-red-600" : undefined}
            aria-label={A.delete}
            title={A.delete}
          >
            <Trash2 />
            {compact ? null : A.delete}
          </Button>
        }
      />
    </div>
  );
}
