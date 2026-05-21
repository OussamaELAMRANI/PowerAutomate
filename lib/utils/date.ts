import { format } from "@formkit/tempo";

/**
 * Formats a date as DD.MM.YYYY (e.g. 08.05.2026)
 * Used for all date output in generated documents.
 */
export const formatGermanyDate = (date: Date): string => {
  return format(date, "DD.MM.YYYY");
};