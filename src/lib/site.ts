/** App name shown in the browser tab, nav bar, sidebar and footer. */
export const APP_NAME = "হিসাব ইন";

/**
 * Public base URL of the site (e.g. https://hisab.in), from the APP_URL env
 * variable. Used for shareable report links. Server-only (env is read at runtime);
 * returns "" when unset, in which case the browser's own origin is used.
 */
export function getAppUrl(): string {
  return (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");
}
