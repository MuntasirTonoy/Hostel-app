"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "cn";
import { useI18n } from "@/i18n/client";

// Number of lines (the text comes from the dictionary).
const LINE_COUNT = 4;

// How far the section has scrolled into view (0–1) when the picture reveal starts and ends.
const REVEAL_START = 0.1;
const REVEAL_END = 0.7;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

/**
 * Scroll-driven landing section: the portrait is revealed first, then each line
 * appears beside it one by one, with the current line highlighted.
 */
export function ScrollPortrait() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useI18n();
  const lines = t.scrollPortrait.lines;
  const [active, setActive] = useState(-1);
  const [titleShown, setTitleShown] = useState(false);
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the section's top enters at the bottom of the screen, 1 once it reaches the top
      // and the content pins. The picture animates during this entry, so it is never empty.
      const entry = clamp((vh - rect.top) / vh);
      // 0→1 while pinned; drives the lines.
      const pinned = clamp(-rect.top / (rect.height - vh));
      const reveal = clamp((entry - REVEAL_START) / (REVEAL_END - REVEAL_START));
      section.style.setProperty("--reveal", String(reveal));
      // The picture starts centred and slides aside just before the lines begin.
      section.style.setProperty("--shift", String(1 - clamp((entry - REVEAL_END) / (1 - REVEAL_END))));
      setTitleShown(reveal >= 0.4);
      setActive(entry < 0.95 ? -1 : Math.min(LINE_COUNT - 1, Math.floor(pinned * LINE_COUNT)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative border-b", reduced ? "py-12 sm:py-16" : "h-[280svh] sm:h-[340svh]")}
      style={{ "--reveal": reduced ? 1 : 0, "--shift": reduced ? 0 : 1 } as React.CSSProperties}
    >
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-4 overflow-hidden px-4 sm:gap-6 lg:grid-cols-2 lg:gap-12",
          !reduced && "sticky top-0 h-svh content-center",
        )}
      >
        <div className="relative mx-auto w-full max-w-60 sm:max-w-sm lg:max-w-md lg:[translate:calc(var(--shift)*(50%+1.5rem))_0]">
          <div
            aria-hidden
            className="absolute inset-[10%] rounded-full bg-primary/25 blur-3xl"
            style={{ opacity: "var(--reveal)" }}
          />
          <Image
            src="/images/manager.webp"
            alt={t.scrollPortrait.alt}
            width={900}
            height={982}
            sizes="(min-width: 1024px) 28rem, (min-width: 640px) 24rem, 20rem"
            className="relative mx-auto h-auto max-h-[38svh] w-auto sm:max-h-[45svh] object-contain lg:max-h-[80svh]"
            style={{
              clipPath: "circle(calc(var(--reveal) * 75%) at 50% 55%)",
              opacity: "calc(0.3 + var(--reveal) * 0.7)",
              scale: "calc(0.85 + var(--reveal) * 0.15)",
            }}
          />
        </div>

        <div className="space-y-2.5 text-center sm:space-y-6 lg:text-left">
          <p
            className={cn(
              "text-sm font-semibold text-primary transition-all duration-500 ease-out",
              !reduced && !titleShown && "translate-y-4 opacity-0",
            )}
          >
            {t.scrollPortrait.title}
          </p>
          {lines.map((line, i) => {
            const shown = reduced || i <= active;
            const current = reduced || i === active;
            return (
              <p
                key={i}
                className={cn(
                  "text-lg leading-snug font-bold transition-all duration-500 ease-out sm:text-3xl",
                  !shown && "translate-y-6 opacity-0",
                  shown && !current && "opacity-35",
                )}
              >
                {line.before}
                <mark
                  className={cn(
                    "rounded-sm bg-linear-to-r from-primary/25 to-primary/25 bg-no-repeat px-1 text-inherit transition-[background-size,color] delay-200 duration-700 ease-out [background-color:transparent]",
                    current ? "bg-size-[100%_100%] text-primary" : "bg-size-[0%_100%]",
                  )}
                >
                  {line.mark}
                </mark>
                {line.after}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
