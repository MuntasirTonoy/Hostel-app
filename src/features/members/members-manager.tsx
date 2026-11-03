"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Check, CircleCheck, Loader2, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/features/accounting/confirm-button";
import { FieldError } from "@/components/field-error";
import { useI18n } from "@/i18n/client";
import { createMemberSchema, memberNameSchema, type CreateMemberInput } from "@/schemas/member";
import type { MemberDTO } from "@/types/accounting";
import { createMemberAction, deleteMemberAction, updateMemberAction } from "./actions";

export function MembersManager({ initialMembers }: { initialMembers: MemberDTO[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { t, f, tm } = useI18n();
  const M = t.members;

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
      toast.success(M.added);
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
    if (!parsed.success) return void toast.error(tm(parsed.error.issues[0].message));
    update(editing.id, { name: parsed.data }, M.nameUpdated);
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await deleteMemberAction(id);
      setBusyId(null);
      if (!result.ok) return void toast.error(result.error);
      setMembers((prev) => prev.filter((p) => p.id !== id));
      toast.success(M.deleted);
    });
  }

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{M.addTitle}</CardTitle>
          <CardDescription>{M.addDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1">
              <Input placeholder={M.namePlaceholder} aria-label={M.namePlaceholder} {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <Button type="submit" disabled={pending}>
              <UserPlus /> {M.add}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{M.listTitle}</CardTitle>
          <CardDescription>{M.listDescription(f.num(members.length), f.num(activeCount))}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{M.empty}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 px-3 py-2.5 sm:gap-3">
                  {editing?.id === m.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Input
                        autoFocus
                        value={editing.name}
                        onChange={(e) => setEditing({ id: m.id, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveName();
                          if (e.key === "Escape") setEditing(null);
                        }}
                        aria-label={M.newName}
                      />
                      <Button size="icon" variant="ghost" onClick={saveName} aria-label={t.common.saveShort}>
                        <Check />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(null)} aria-label={t.common.cancel}>
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={`truncate ${m.isActive ? "font-medium" : "text-muted-foreground line-through"}`}
                      >
                        {m.name}
                      </span>
                      {m.isActive ? (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                          {M.active}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{M.inactive}</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    {busyId === m.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing({ id: m.id, name: m.name })}
                      aria-label={M.editName(m.name)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="max-sm:size-8 max-sm:px-0"
                      aria-label={m.isActive ? M.deactivateLabel(m.name) : M.activateLabel(m.name)}
                      title={m.isActive ? M.deactivate : M.activate}
                      disabled={busyId === m.id}
                      onClick={() =>
                        update(
                          m.id,
                          { isActive: !m.isActive },
                          m.isActive ? M.deactivated : M.activated,
                        )
                      }
                    >
                      {m.isActive ? <Ban className="sm:hidden" /> : <CircleCheck className="sm:hidden" />}
                      <span className="max-sm:hidden">{m.isActive ? M.deactivate : M.activate}</span>
                    </Button>
                    <ConfirmAction
                      destructive
                      title={M.deleteTitle(m.name)}
                      description={M.deleteDescription}
                      confirmLabel={t.common.delete}
                      onConfirm={() => remove(m.id)}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-600"
                          aria-label={M.deleteLabel(m.name)}
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
