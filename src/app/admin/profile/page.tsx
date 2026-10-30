import { Building2, FileCheck2, FilePen, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, StatCard } from "@/components/admin/page-header";
import { PublicLinkCard } from "@/components/admin/public-link-card";
import { ChangePasswordForm } from "@/features/auth/change-password-form";
import { ProfileForm } from "@/features/auth/profile-form";
import { SettingsForms } from "@/features/auth/settings-forms";
import { requireAdminPage } from "@/lib/authz";
import { toBanglaDigits } from "@/lib/money";
import { formatBanglaDate } from "@/lib/months";
import { getAppUrl } from "@/lib/site";
import { getProfile } from "@/services/admin-service";
import { getHostelStats } from "@/services/hostel-service";

export const metadata: Metadata = { title: "প্রোফাইল" };

export default async function ProfilePage() {
  const { userId, hostel } = await requireAdminPage();
  const [profile, stats] = await Promise.all([getProfile(userId), getHostelStats(hostel.id)]);
  if (!profile) redirect("/login");

  const initial = (profile.name || profile.email).trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="প্রোফাইল" />

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
            Admin · সদস্য হয়েছেন {formatBanglaDate(new Date(profile.createdAt))}
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="সক্রিয় সদস্য"
          value={`${toBanglaDigits(stats.activeMembers)} / ${toBanglaDigits(stats.totalMembers)}`}
          icon={<UsersRound className="size-4" />}
        />
        <StatCard
          label="প্রকাশিত হিসাব"
          value={toBanglaDigits(stats.publishedReports)}
          icon={<FileCheck2 className="size-4" />}
          highlight
        />
        <StatCard label="খসড়া হিসাব" value={toBanglaDigits(stats.draftReports)} icon={<FilePen className="size-4" />} />
        <StatCard label="হোস্টেল কোড" value={<span className="font-mono">{hostel.code}</span>} icon={<Building2 className="size-4" />} />
      </div>

      <PublicLinkCard code={hostel.code} baseUrl={getAppUrl()} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileForm name={profile.name} email={profile.email} />
          <SettingsForms hostelName={hostel.name} />
        </div>
        <div id="password">
          <ChangePasswordForm email={profile.email} />
        </div>
      </div>
    </div>
  );
}
