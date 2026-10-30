import type { z } from "zod";
import { ServiceError } from "./errors";

/** Parses input with a Zod schema, throwing a Bangla ServiceError on failure. */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const messages = [...new Set(result.error.issues.map((i) => i.message))];
    throw new ServiceError("VALIDATION", messages[0] ?? "তথ্য সঠিক নয়।", messages);
  }
  return result.data;
}
