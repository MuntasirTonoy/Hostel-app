"use client";

import { Loader2, LogIn, Calculator } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/site";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calculator />
        </div>
        <CardTitle className="text-xl">Admin লগইন</CardTitle>
        <CardDescription>{APP_NAME} ড্যাশবোর্ডে প্রবেশ করুন</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <LogIn />} লগইন করুন
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            অ্যাকাউন্ট নেই?{" "}
            <Link href="/register" className="font-medium text-primary underline underline-offset-4">
              রেজিস্টার করুন
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
