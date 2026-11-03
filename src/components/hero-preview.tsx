"use client";

import { CheckCircle2, FileDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { useI18n } from "@/i18n/client";

// Sample figures only (paisa / meal hundredths).
const MEAL_RATE = 5850;
const ROWS = [
  { meals: 6200, balance: 22300 },
  { meals: 5800, balance: -54300 },
  { meals: 4550, balance: 18825 },
  { meals: 7000, balance: 25500 },
];
const COUNT_MS = 1400;

/** Decorative, animated mock of a monthly report for the landing hero. */
export function HeroPreview() {
  const [rate, setRate] = useState(0);
  const { t, f } = useI18n();
  const p = t.heroPreview;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      start ||= now;
      const t = reduced ? 1 : Math.min(1, (now - start) / COUNT_MS);
      const eased = 1 - (1 - t) ** 3;
      setRate(Math.round(MEAL_RATE * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm select-none lg:max-w-md">
      <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl" />

      <div className="relative rounded-2xl border bg-card/90 p-4 shadow-xl backdrop-blur sm:p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {f.period(10, 2026)} · {t.common.published}
            </p>
            <p className="font-semibold">{p.title}</p>
          </div>
          <div className="rounded-xl bg-primary px-3 py-1.5 text-right text-primary-foreground">
            <p className="text-[10px] leading-none opacity-80">{p.mealRate}</p>
            <p className="text-lg font-bold tabular-nums leading-tight">{f.taka(rate)}</p>
          </div>
        </div>

        <div className="space-y-2">
          {ROWS.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-500"
              style={{ animationDelay: `${500 + i * 150}ms` }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {p.names[i][0]}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{p.names[i]}</span>
              <span className="hidden text-xs whitespace-nowrap text-muted-foreground min-[380px]:inline">{p.meals(f.mealUnits(row.meals))}</span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-right text-xs font-semibold whitespace-nowrap tabular-nums sm:min-w-28",
                  row.balance >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400",
                )}
              >
                {row.balance >= 0 ? p.refund : p.due} {f.taka(Math.abs(row.balance))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -top-4 -left-3 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-lg motion-safe:animate-float sm:-left-8">
        <CheckCircle2 className="size-4 text-primary" /> {p.balanced}
      </div>
      <div className="absolute -right-2 top-1/2 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-lg motion-safe:animate-float [animation-delay:-2s] sm:-right-8">
        <TrendingUp className="size-4 text-primary" /> {p.automatic}
      </div>
      <div className="absolute -bottom-4 left-6 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-lg motion-safe:animate-float [animation-delay:-4s]">
        <FileDown className="size-4 text-primary" /> {p.pdfReady}
      </div>
    </div>
  );
}
