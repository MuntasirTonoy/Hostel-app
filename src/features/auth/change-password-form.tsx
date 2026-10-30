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
import { changePasswordSchema } from "@/schemas/auth";
import { changePasswordAction } from "./actions";

const FIELDS = [
  ["currentPassword", "বর্তমান পাসওয়ার্ড", "current-password"],
  ["newPassword", "নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)", "new-password"],
  ["confirmPassword", "নতুন পাসওয়ার্ড আবার লিখুন", "new-password"],
] as const;

export function ChangePasswordForm({ email }: { email: string }) {
  const [saving, startSaving] = useTransition();
  const [show, setShow] = useState(false);
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const submit = form.handleSubmit((values) =>
    startSaving(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) return void toast.error(result.error);
      form.reset();
      toast.success("পাসওয়ার্ড পরিবর্তন করা হয়েছে। পরেরবার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।");
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>পাসওয়ার্ড পরিবর্তন</CardTitle>
        <CardDescription>লগইন ইমেইল: {email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {FIELDS.map(([name, label, autoComplete]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label}</Label>
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
              {show ? <EyeOff /> : <Eye />} {show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <KeyRound />} পাসওয়ার্ড পরিবর্তন করুন
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
