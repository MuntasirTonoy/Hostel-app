import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { translateMessage } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { DatabaseConnectionError } from "./mongodb";
import { MESSAGES, ServiceError } from "@/services/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: string[]; code?: string };

/** The visitor's language; Bangla when there is no request (e.g. in tests). */
async function actionLocale(): Promise<Locale> {
  try {
    return await getLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Runs a server action body and converts thrown errors into a result in the visitor's language. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const locale = await actionLocale();
    const tr = (message: string) => translateMessage(message, locale);
    if (error instanceof ServiceError) {
      return { ok: false, error: tr(error.message), details: error.details?.map(tr), code: error.code };
    }
    if (error instanceof DatabaseConnectionError) {
      console.error(error.cause ?? error);
      return { ok: false, error: tr(error.message), code: "DATABASE" };
    }
    console.error(error);
    return { ok: false, error: tr(MESSAGES.UNKNOWN), code: "UNKNOWN" };
  }
}
