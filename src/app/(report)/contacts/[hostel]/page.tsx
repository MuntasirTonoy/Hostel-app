import { FileX2, Phone } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { getI18n } from "@/i18n/server";
import { getPublicContacts } from "@/services/public-contacts-service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  // The page lists personal phone numbers, so keep it out of search engines.
  return { title: t.nav.contacts, robots: { index: false, follow: false } };
}

export default async function PublicContactsPage({ params }: PageProps<"/contacts/[hostel]">) {
  // Always read fresh data so an edited number appears immediately.
  await connection();
  const { hostel } = await params;
  const [{ hostelName, contacts }, { t }] = await Promise.all([getPublicContacts(hostel), getI18n()]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 sm:py-10">
      <div className="flex justify-end gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      {hostelName === null ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileX2 className="size-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t.publicReport.hostelNotFound}</h1>
          <p className="text-muted-foreground">{t.publicReport.checkLink}</p>
        </div>
      ) : (
        <>
          <header className="space-y-1 text-center">
            <p className="text-base font-semibold text-primary">{hostelName}</p>
            <h1 className="text-2xl font-bold sm:text-3xl">{t.nav.contacts}</h1>
          </header>
          {contacts.length === 0 ? (
            <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
              {t.contacts.noneYet}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">{c.phone}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    aria-label={t.contacts.call(c.name)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                  >
                    <Phone className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
