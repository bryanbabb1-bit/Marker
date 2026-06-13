// True only for a real YYYY-MM-DD calendar date (rejects 2026-13-40 etc.).
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// Basic HH:MM (24h) check for optional tee times.
export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

// 'YYYY-MM' for the month containing `d` (UTC). Used to scope monthly champions.
export function monthKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7);
}

// The 'YYYY-MM' before a given month key (e.g. '2026-01' -> '2025-12').
export function priorMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1)); // m is 1-based; m-2 = prior month
  return d.toISOString().slice(0, 7);
}

// True for a well-formed 'YYYY-MM' (cheap validation for the ?month param).
export function isValidMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
