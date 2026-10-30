import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/register-form";
import { getAdminSession } from "@/lib/authz";

export const metadata: Metadata = { title: "রেজিস্টার" };

export default async function RegisterPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <RegisterForm />
    </main>
  );
}
