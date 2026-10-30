import { DatabaseConnectionError } from "./mongodb";
import { MESSAGES, ServiceError } from "@/services/errors";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: string[]; code?: string };

/** Runs a server action body and converts thrown errors into a Bangla result. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ServiceError) {
      return { ok: false, error: error.message, details: error.details, code: error.code };
    }
    if (error instanceof DatabaseConnectionError) {
      console.error(error.cause ?? error);
      return { ok: false, error: error.message, code: "DATABASE" };
    }
    console.error(error);
    return { ok: false, error: MESSAGES.UNKNOWN, code: "UNKNOWN" };
  }
}
