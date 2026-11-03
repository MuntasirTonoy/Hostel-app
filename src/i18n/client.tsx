"use client";

import { createContext, use, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getI18nFor, type I18n } from "./index";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Provides the visitor's language (read from the cookie by the root layout). */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** Text and formatters for Client Components. */
export function useI18n(): I18n {
  return getI18nFor(use(LocaleContext));
}
