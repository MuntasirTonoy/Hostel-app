import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { getAdminSession } from "@/lib/authz";

export const metadata: Metadata = { title: "Admin লগইন" };

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <LoginForm />
    </main>
  );
}
