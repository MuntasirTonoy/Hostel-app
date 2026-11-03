import { formatAmount, formatMealUnits, formatTaka, localizeDigits, mealCountToUnits } from "@/lib/money";
import { formatDate, monthName, monthNames, periodLabel } from "@/lib/months";
import type { Locale } from "./config";
import bn, { type Dictionary } from "./dictionaries/bn";
import en from "./dictionaries/en";
import { translateMessage } from "./messages";

const DICTIONARIES: Record<Locale, Dictionary> = { bn, en };

/** Locale-aware formatters: Bangla digits/months for "bn", ASCII/English for "en". */
export function makeFormat(locale: Locale) {
  return {
    num: (n: number | string) => localizeDigits(n, locale),
    amount: (paisa: number) => formatAmount(paisa, locale),
    taka: (paisa: number) => formatTaka(paisa, locale),
    /** Meal hundredths (e.g. 4550) -> "45.5". */
    mealUnits: (units: number) => formatMealUnits(units, locale),
    /** Stored meal count (e.g. 45.5) -> "45.5". */
    meals: (count: number) => formatMealUnits(mealCountToUnits(count), locale),
    period: (month: number, year: number) => periodLabel(month, year, locale),
    month: (month: number) => monthName(month, locale),
    months: monthNames(locale),
    date: (date: Date) => formatDate(date, locale),
  };
}

export type Format = ReturnType<typeof makeFormat>;

export interface I18n {
  locale: Locale;
  /** UI text in the current language. */
  t: Dictionary;
  /** Number, money and date formatters. */
  f: Format;
  /** Translates a (Bangla) server or validation message. */
  tm: <M extends string | undefined>(message: M) => M;
}

const cache = new Map<Locale, I18n>();

export function getI18nFor(locale: Locale): I18n {
  let i18n = cache.get(locale);
  if (!i18n) {
    i18n = {
      locale,
      t: DICTIONARIES[locale],
      f: makeFormat(locale),
      tm: ((message: string | undefined) => translateMessage(message, locale)) as I18n["tm"],
    };
    cache.set(locale, i18n);
  }
  return i18n;
}

export type { Locale } from "./config";
export type { Dictionary } from "./dictionaries/bn";
