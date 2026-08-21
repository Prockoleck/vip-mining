export function parseUTC(dateStr: string): Date {
  return new Date(dateStr + (dateStr.endsWith("Z") ? "" : "Z"));
}
