import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { HeroPreview } from "@/components/hero-preview";
import { Reveal } from "@/components/reveal";
import { ScrollPortrait } from "@/components/scroll-portrait";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { getAdminSession } from "@/lib/authz";

const FEATURE_ICONS = [Calculator, UsersRound, Wallet, FileText, Printer, ShieldCheck];

export default async function LandingPage() {
  const loggedIn = (await getAdminSession()) !== null;
  const { t } = await getI18n();
  const features = t.landing.features.map((feature, i) => ({ ...feature, icon: FEATURE_ICONS[i] }));
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b bg-linear-to-b from-primary/10 to-background lg:h-screen">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div
          aria-hidden
          className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/20 blur-3xl motion-safe:animate-float"
        />
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 size-80 rounded-full bg-amber-400/20 blur-3xl motion-safe:animate-float [animation-delay:-3s]"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          <div className="flex flex-col items-center gap-5 text-center sm:gap-6 lg:items-start lg:text-left">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur sm:text-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                {t.landing.badge}
              </span>
            </Reveal>
            <Reveal>
              <h1 className="text-[1.75rem] font-bold leading-tight sm:text-5xl">
                {t.landing.titleLead} <br /> <span className="text-primary">{t.landing.titleHighlight}</span>
              </h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                {t.landing.intro}
              </p>
            </Reveal>
            <Reveal
              delay={300}
              className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center lg:justify-start"
            >
              <Button asChild size="lg">
                {loggedIn ? (
                  <Link href="/admin">
                    {t.landing.goToDashboard} <ArrowRight />
                  </Link>
                ) : (
                  <Link href="/register">
                    {t.landing.startFree} <ArrowRight />
                  </Link>
                )}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/monthly-bill">{t.landing.viewBill}</Link>
              </Button>
            </Reveal>
            <Reveal delay={450}>
              <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                {t.landing.checks.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="px-4 pb-4 sm:px-8">
            <HeroPreview />
          </div>
        </div>
      </section>

      <ScrollPortrait />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <Reveal>
          <h2 className="mb-6 text-center text-xl font-bold sm:mb-8 sm:text-2xl">{t.landing.featuresTitle}</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={(i % 3) * 120} className="h-full">
              <div className="h-full rounded-xl border bg-card p-3 transition-shadow hover:shadow-md sm:p-5">
                <span className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-3 sm:size-10">
                  <Icon className="size-4 sm:size-5" />
                </span>
                <h3 className="mb-1 text-sm font-semibold leading-snug sm:text-base">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
