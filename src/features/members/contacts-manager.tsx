"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Pencil, Phone, Trash2, Undo2, UserPlus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/field-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmAction } from "@/features/accounting/confirm-button";
import { useI18n } from "@/i18n/client";
import { createContactSchema, createMemberSchema, type CreateContactInput } from "@/schemas/member";
import type { ContactDTO, MemberDTO } from "@/types/accounting";
import {
  createContactAction,
  deleteContactAction,
  updateContactAction,
  updateMemberAction,
} from "./actions";

type Row = { kind: "member" | "contact"; id: string; name: string; phone: string; hidden?: boolean };

/**
 * Admin-only contact list: active members come from the member registry, and the
 * form adds separate contacts that never join it.
 */
export function ContactsManager({
  initialMembers,
  initialContacts,
}: {
  initialMembers: MemberDTO[];
  initialContacts: ContactDTO[];
}) {
  const [rows, setRows] = useState<Row[]>(() => [
    ...initialMembers.map(
      (m): Row => ({ kind: "member", id: m.id, name: m.name, phone: m.phone, hidden: m.hiddenFromContacts }),
    ),
    ...initialContacts.map((c): Row => ({ kind: "contact", ...c })),
  ]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [pending, startTransition] = useTransition();
  const { t, f, tm } = useI18n();
  const C = t.contacts;

  const form = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: { name: "", phone: "" },
  });

  const onCreate = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createContactAction(values);
      if (!result.ok) return void toast.error(result.error);
      setRows((prev) => [{ kind: "contact", ...result.data }, ...prev]);
      form.reset();
      toast.success(C.added);
    }),
  );

  function save() {
    if (!editing) return;
    const { id, kind, name, phone } = editing;
    // A member may have no number; a separate contact exists only for its number.
    const parsed = (kind === "contact" ? createContactSchema : createMemberSchema).safeParse({ name, phone });
    if (!parsed.success) return void toast.error(tm(parsed.error.issues[0].message));
    const values = { id, name: parsed.data.name, phone: parsed.data.phone ?? "" };
    startTransition(async () => {
      const result = await (kind === "contact" ? updateContactAction(values) : updateMemberAction(values));
      if (!result.ok) return void toast.error(result.error);
      const { name: newName, phone: newPhone } = result.data;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name: newName, phone: newPhone } : r)));
      setEditing(null);
      toast.success(C.updated);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteContactAction(id);
      if (!result.ok) return void toast.error(result.error);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success(C.deleted);
    });
  }

  /** Takes a member off (or back onto) the contact list; the member record is unaffected. */
  function setHidden(id: string, hidden: boolean) {
    startTransition(async () => {
      const result = await updateMemberAction({ id, hiddenFromContacts: hidden });
      if (!result.ok) return void toast.error(result.error);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, hidden } : r)));
      toast.success(hidden ? C.deleted : C.restored);
    });
  }

  const onEditKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(null);
  };

  const visible = rows.filter((r) => !r.hidden);
  const removed = rows.filter((r) => r.hidden);
  const withPhone = visible.filter((r) => r.phone).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{C.addTitle}</CardTitle>
          <CardDescription>{C.addDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1">
              <Input placeholder={C.namePlaceholder} aria-label={C.namePlaceholder} {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div className="flex-1 space-y-1">
              <Input type="tel" placeholder={C.phonePlaceholder} aria-label={C.phoneLabel} {...form.register("phone")} />
              <FieldError message={form.formState.errors.phone?.message} />
            </div>
            <Button type="submit" disabled={pending}>
              <UserPlus /> {C.add}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{C.listTitle}</CardTitle>
          <CardDescription>{C.listDescription(f.num(visible.length), f.num(withPhone))}</CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{C.empty}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {visible.map((r) =>
                editing?.id === r.id ? (
                  <li key={r.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                    <Input
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={onEditKey}
                      aria-label={C.namePlaceholder}
                    />
                    <Input
                      type="tel"
                      value={editing.phone}
                      placeholder={C.phonePlaceholder}
                      onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                      onKeyDown={onEditKey}
                      aria-label={C.phoneLabel}
                    />
                    <div className="flex shrink-0 justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={save} disabled={pending} aria-label={t.common.saveShort}>
                        {pending ? <Loader2 className="animate-spin" /> : <Check />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditing(null)} aria-label={t.common.cancel}>
                        <X />
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li key={r.id} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                      <div className="flex min-w-0 items-center gap-2 sm:flex-1">
                        <p className="truncate font-medium">{r.name}</p>
                        {r.kind === "contact" ? <Badge variant="secondary">{C.notMember}</Badge> : null}
                      </div>
                      {r.phone ? (
                        <p className="flex items-center gap-1.5 text-sm tabular-nums sm:flex-1">
                          <Phone className="size-3.5 text-muted-foreground" aria-hidden /> {r.phone}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground sm:flex-1">{C.noNumber}</p>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label={C.editLabel(r.name)}>
                      <Pencil />
                    </Button>
                    <ConfirmAction
                      destructive
                      title={C.deleteTitle(r.name)}
                      description={r.kind === "member" ? C.removeMemberDescription : C.deleteDescription}
                      confirmLabel={C.remove}
                      onConfirm={() => (r.kind === "member" ? setHidden(r.id, true) : remove(r.id))}
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-600"
                          aria-label={C.deleteLabel(r.name)}
                        >
                          <Trash2 />
                        </Button>
                      }
                    />
                  </li>
                ),
              )}
            </ul>
          )}
          {removed.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{C.removedTitle}</p>
              <ul className="divide-y rounded-lg border">
                {removed.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="truncate text-muted-foreground">{r.name}</span>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => setHidden(r.id, false)}>
                      <Undo2 /> {C.restore}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
