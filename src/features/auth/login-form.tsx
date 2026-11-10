"use client";

import { Loader2, LogIn, Calculator } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";
import { APP_NAME } from "@/lib/site";
import { loginAction, type LoginState } from "./actions";
import { GoogleSignInButton } from "./google-sign-in-button";

export function LoginForm({
  googleEnabled = false,
  oauthError = false,
}: {
  googleEnabled?: boolean;
  /** Auth.js redirected back here with ?error= (e.g. a failed Google sign-in). */
  oauthError?: boolean;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const { t } = useI18n();
  const a = t.auth;
  const error = state.error ?? (oauthError ? a.oauthFailed : undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calculator />
        </div>
        <CardTitle className="text-xl">{a.loginTitle}</CardTitle>
        <CardDescription>{a.loginDescription(APP_NAME)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {googleEnabled ? <GoogleSignInButton /> : null}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{a.email}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{a.password}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <LogIn />} {a.loginSubmit}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {a.noAccount}{" "}
            <Link href="/register" className="font-medium text-primary underline underline-offset-4">
              {a.registerLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
