/** Display lucky numbers 1–99 as three digits (e.g. 1 → 001, 99 → 099). */
export function formatLuckyNumber(raw: string): string {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return s;

  const n = parseInt(s, 10);
  if (n >= 1 && n <= 99) return String(n).padStart(3, "0");

  return s;
}
