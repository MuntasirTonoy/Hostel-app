import { Building2, FileCheck2, FilePen, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, StatCard } from "@/components/admin/page-header";
import { PublicLinkCard } from "@/components/admin/public-link-card";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { HostelIdForm } from "@/features/auth/hostel-id-form";
import { ProfileForm } from "@/features/auth/profile-form";
import { SettingsForms } from "@/features/auth/settings-forms";
import { getI18n } from "@/i18n/server";
import { requireAdminPage } from "@/lib/authz";
import { getAppUrl } from "@/lib/site";
import { getProfile } from "@/services/admin-service";
import { getHostelStats } from "@/services/hostel-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.profile.title };
}

export default async function ProfilePage() {
  const { userId, hostel } = await requireAdminPage();
  const [profile, stats, { t, f }] = await Promise.all([
    getProfile(userId),
    getHostelStats(hostel.id),
    getI18n(),
  ]);
  if (!profile) redirect("/login");

  const initial = (profile.name || profile.email).trim().charAt(0).toUpperCase();
  const baseUrl = getAppUrl();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t.profile.title} />

      <section className="flex flex-col items-center gap-4 rounded-xl border bg-card p-5 text-center sm:flex-row sm:text-left">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xl font-semibold">{profile.name || "—"}</p>
          <p className="truncate text-muted-foreground">{profile.email}</p>
          <p className="text-sm text-muted-foreground">
            {t.profile.memberSince(f.date(new Date(profile.createdAt)))}
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.profile.stats.activeMembers}
          value={`${f.num(stats.activeMembers)} / ${f.num(stats.totalMembers)}`}
          icon={<UsersRound className="size-4" />}
        />
        <StatCard
          label={t.profile.stats.published}
          value={f.num(stats.publishedReports)}
          icon={<FileCheck2 className="size-4" />}
          highlight
        />
        <StatCard
          label={t.profile.stats.drafts}
          value={f.num(stats.draftReports)}
          icon={<FilePen className="size-4" />}
        />
        <StatCard
          label={t.profile.stats.hostelId}
          value={<span className="block truncate font-mono">{hostel.code}</span>}
          icon={<Building2 className="size-4" />}
        />
      </div>

      <PublicLinkCard code={hostel.code} baseUrl={baseUrl} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Left: the account (personal details + password) */}
        <div className="space-y-6">
          <ProfileForm name={profile.name} email={profile.email} />
          <div id="password" className="scroll-mt-20">
            <ChangePasswordForm email={profile.email} />
          </div>
        </div>
        {/* Right: the hostel (mess name + Hostel ID) */}
        <div className="space-y-6">
          <SettingsForms hostelName={hostel.name} />
          {/* key: reset the form after the ID changes and the page refreshes */}
          <HostelIdForm key={hostel.code} code={hostel.code} baseUrl={baseUrl} />
        </div>
      </div>
    </div>
  );
}
