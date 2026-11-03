import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getI18nFor, type I18n } from "./index";

/** The visitor's language from the `lang` cookie (Bangla by default). Once per request. */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/** Text and formatters for Server Components, metadata and Server Actions. */
export async function getI18n(): Promise<I18n> {
  return getI18nFor(await getLocale());
}
