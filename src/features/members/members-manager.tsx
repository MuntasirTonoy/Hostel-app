"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/features/accounting/confirm-button";
import { FieldError } from "@/features/accounting/new-month-form";
import { toBanglaDigits } from "@/lib/money";
import { createMemberSchema, memberNameSchema, type CreateMemberInput } from "@/schemas/member";
import type { MemberDTO } from "@/types/accounting";
import { createMemberAction, deleteMemberAction, updateMemberAction } from "./actions";

export function MembersManager({ initialMembers }: { initialMembers: MemberDTO[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { name: "" },
  });

  const replace = (m: MemberDTO) => setMembers((prev) => prev.map((p) => (p.id === m.id ? m : p)));

  const onCreate = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createMemberAction(values);
      if (!result.ok) return void toast.error(result.error);
      setMembers((prev) => [result.data, ...prev]);
      form.reset();
      toast.success("নতুন সদস্য যুক্ত হয়েছে।");
    }),
  );

  function update(id: string, changes: { name?: string; isActive?: boolean }, success: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await updateMemberAction({ id, ...changes });
      setBusyId(null);
      if (!result.ok) return void toast.error(result.error);
      replace(result.data);
      setEditing(null);
      toast.success(success);
    });
  }

  function saveName() {
    if (!editing) return;
    const parsed = memberNameSchema.safeParse(editing.name);
    if (!parsed.success) return void toast.error(parsed.error.issues[0].message);
    update(editing.id, { name: parsed.data }, "নাম হালনাগাদ হয়েছে। পূর্ববর্তী হিসাবের নাম অপরিবর্তিত থাকবে।");
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteMemberAction(id);
      setBusyId(null);
      if (!result.ok) return void toast.error(result.error);
      setMembers((prev) => prev.filter((p) => p.id !== id));
      toast.success("সদস্য মুছে ফেলা হয়েছে।");
    });
  }

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>নতুন সদস্য যুক্ত করুন</CardTitle>
          <CardDescription>স্থায়ী সদস্য তালিকায় যুক্ত হবে এবং পরবর্তী মাসের হিসাবে নির্বাচন করা যাবে।</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1">
              <Input placeholder="সদস্যের নাম" aria-label="সদস্যের নাম" {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <Button type="submit" disabled={pending}>
              <UserPlus /> সদস্য যুক্ত করুন
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>স্থায়ী সদস্য তালিকা</CardTitle>
          <CardDescription>
            মোট {toBanglaDigits(members.length)} জন, সক্রিয় {toBanglaDigits(activeCount)} জন। হোস্টেল ছেড়ে গেলে সদস্যকে
            নিষ্ক্রিয় করুন — তিনি পরবর্তী মাসে স্বয়ংক্রিয়ভাবে যুক্ত হবেন না, কিন্তু আগের হিসাব অক্ষত থাকবে।
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">এখনো কোনো সদস্য যুক্ত করা হয়নি।</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  {editing?.id === m.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        autoFocus
                        value={editing.name}
                        onChange={(e) => setEditing({ id: m.id, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveName();
                          if (e.key === "Escape") setEditing(null);
                        }}
                        aria-label="নতুন নাম"
                      />
                      <Button size="icon" variant="ghost" onClick={saveName} aria-label="সংরক্ষণ">
                        <Check />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(null)} aria-label="বাতিল">
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center gap-2">
                      <span className={m.isActive ? "font-medium" : "text-muted-foreground line-through"}>
                        {m.name}
                      </span>
                      {m.isActive ? (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">সক্রিয়</Badge>
                      ) : (
                        <Badge variant="secondary">নিষ্ক্রিয়</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {busyId === m.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing({ id: m.id, name: m.name })}
                      aria-label={`${m.name} এর নাম সম্পাদনা`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === m.id}
                      onClick={() =>
                        update(
                          m.id,
                          { isActive: !m.isActive },
                          m.isActive ? "সদস্য নিষ্ক্রিয় করা হয়েছে।" : "সদস্য সক্রিয় করা হয়েছে।",
                        )
                      }
                    >
                      {m.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                    </Button>
                    <ConfirmAction
                      destructive
                      title={`"${m.name}" কে মুছে ফেলবেন?`}
                      description="শুধু যে সদস্যের কোনো মাসিক হিসাবের ইতিহাস নেই তাকেই মুছে ফেলা যায়। ইতিহাস থাকলে নিষ্ক্রিয় করুন।"
                      confirmLabel="মুছে ফেলুন"
                      onConfirm={() => remove(m.id)}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-600"
                          aria-label={`${m.name} কে মুছুন`}
                        >
                          <Trash2 />
                        </Button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
