"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/field-error";
import { useI18n } from "@/i18n/client";
import { changePasswordSchema } from "@/schemas/auth";
import { changePasswordAction } from "./actions";

const FIELDS = [
  ["currentPassword", "current-password"],
  ["newPassword", "new-password"],
  ["confirmPassword", "new-password"],
] as const;

export function ChangePasswordForm({ email }: { email: string }) {
  const [saving, startSaving] = useTransition();
  const [show, setShow] = useState(false);
  const { t } = useI18n();
  const p = t.profile.password;
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const submit = form.handleSubmit((values) =>
    startSaving(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) return void toast.error(result.error);
      form.reset();
      toast.success(p.changed);
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{p.title}</CardTitle>
        <CardDescription>{p.loginEmail(email)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {FIELDS.map(([name, autoComplete]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{p.fields[name]}</Label>
              <Input
                id={name}
                type={show ? "text" : "password"}
                autoComplete={autoComplete}
                {...form.register(name)}
              />
              <FieldError message={form.formState.errors[name]?.message} />
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShow((s) => !s)}>
              {show ? <EyeOff /> : <Eye />} {show ? p.hide : p.show}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <KeyRound />} {p.submit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
