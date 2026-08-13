/** Local calendar date helpers (YYYY-MM-DD) for API transactionDate. */

export function toDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert YYYY-MM-DD to ISO using the current clock time on that day
 * (so entries show real create time, not a fixed noon).
 */
export function dateInputToIso(dateInput: string, at: Date = new Date()) {
  const [y, m, d] = dateInput.split('-').map(Number);
  if (!y || !m || !d) return at.toISOString();
  return new Date(
    y,
    m - 1,
    d,
    at.getHours(),
    at.getMinutes(),
    at.getSeconds(),
    at.getMilliseconds(),
  ).toISOString();
}

/** Now as ISO — use when the entry is for today / just created. */
export function nowIso() {
  return new Date().toISOString();
}

export function formatDateInputLabel(dateInput: string) {
  const [y, m, d] = dateInput.split('-').map(Number);
  if (!y || !m || !d) return dateInput;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function shiftDateInput(dateInput: string, days: number) {
  const [y, m, d] = dateInput.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  dt.setDate(dt.getDate() + days);
  return toDateInputValue(dt);
}

/** Local YYYY-MM-DD from an ISO / Date string. */
export function isoToDateInput(value: string) {
  return toDateInputValue(new Date(value));
}
