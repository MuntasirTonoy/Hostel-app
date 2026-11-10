import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/register-form";
import { getI18n } from "@/i18n/server";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { getAdminSession } from "@/lib/authz";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.registerMetaTitle };
}

export default async function RegisterPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <RegisterForm googleEnabled={isGoogleAuthEnabled} />
    </main>
  );
}
