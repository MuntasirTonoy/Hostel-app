"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus, Calculator } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/field-error";
import { useI18n } from "@/i18n/client";
import { registerSchema, type RegisterInput } from "@/schemas/auth";
import { registerAction } from "./actions";

const FIELDS = [
  { name: "name", type: "text", autoComplete: "name" },
  { name: "email", type: "email", autoComplete: "email" },
  { name: "hostelName", type: "text", autoComplete: "organization" },
  { name: "password", type: "password", autoComplete: "new-password" },
  { name: "confirmPassword", type: "password", autoComplete: "new-password" },
] as const;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();
  const a = t.auth;
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", hostelName: "", password: "", confirmPassword: "" },
  });

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      // On success the action redirects to the dashboard.
      const result = await registerAction(values);
      setError(result?.error ?? null);
    }),
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calculator />
        </div>
        <CardTitle className="text-xl">{a.registerTitle}</CardTitle>
        <CardDescription>{a.registerDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {FIELDS.map(({ name, type, autoComplete }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{a.registerFields[name]}</Label>
              <Input id={name} type={type} autoComplete={autoComplete} {...form.register(name)} />
              <FieldError message={form.formState.errors[name]?.message} />
            </div>
          ))}
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} {a.registerSubmit}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {a.haveAccount}{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              {a.loginLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
