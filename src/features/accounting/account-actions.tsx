"use client";

import { Loader2, LockOpen, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  /** e.g. "অক্টোবর ২০২৬" — shown in the confirmation text. */
  label: string;
  compact?: boolean;
  afterDelete?: "refresh" | "list";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function unpublish() {
    startTransition(async () => {
      const result = await unpublishAccountAction(id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`${label} মাসের হিসাব অপ্রকাশিত করা হয়েছে। এখন সম্পাদনা করতে পারবেন।`);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteAccountAction(id);
      if (!result.ok) return void toast.error(result.error);
      toast.success(`${label} মাসের হিসাব মুছে ফেলা হয়েছে।`);
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
          title="হিসাবটি অপ্রকাশিত করবেন?"
          description={
            <p>
              {label} মাসের হিসাবটি পাবলিক পাতা থেকে সরে যাবে এবং খসড়া হিসেবে সম্পাদনার জন্য খুলবে। সংশোধনের পর আবার
              প্রকাশ করতে হবে।
            </p>
          }
          confirmLabel="অপ্রকাশিত করুন"
          onConfirm={unpublish}
          trigger={
            <Button
              variant="outline"
              size={size}
              disabled={pending}
              aria-label="অপ্রকাশিত করুন"
              title="অপ্রকাশিত করুন"
            >
              {pending && !compact ? <Loader2 className="animate-spin" /> : <LockOpen />}
              {compact ? null : "অপ্রকাশিত করুন"}
            </Button>
          }
        />
      ) : null}
      <ConfirmAction
        destructive
        title="হিসাবটি মুছে ফেলবেন?"
        description={
          <p>
            {label} মাসের হিসাবটি স্থায়ীভাবে মুছে যাবে
            {status === "PUBLISHED" ? " এবং পাবলিক পাতা থেকেও সরে যাবে" : ""}। এটি আর ফিরিয়ে আনা যাবে না। সদস্য
            তালিকা অপরিবর্তিত থাকবে।
          </p>
        }
        confirmLabel="মুছে ফেলুন"
        onConfirm={remove}
        trigger={
          <Button
            variant={compact ? "ghost" : "destructive"}
            size={size}
            disabled={pending}
            className={compact ? "text-muted-foreground hover:text-red-600" : undefined}
            aria-label="মুছে ফেলুন"
            title="মুছে ফেলুন"
          >
            <Trash2 />
            {compact ? null : "মুছে ফেলুন"}
          </Button>
        }
      />
    </div>
  );
}
