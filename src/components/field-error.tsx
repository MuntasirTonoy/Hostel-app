"use client";

import { useI18n } from "@/i18n/client";

/** Small red validation message under a form field (translated to the UI language). */
export function FieldError({ message }: { message?: string }) {
  const { tm } = useI18n();
  return message ? <p className="text-sm text-red-600">{tm(message)}</p> : null;
}
