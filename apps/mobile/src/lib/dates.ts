/** Local calendar date helpers (YYYY-MM-DD) for API transactionDate. */

export function toDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Noon local time avoids timezone day-shift when sending to API. */
export function dateInputToIso(dateInput: string) {
  const [y, m, d] = dateInput.split('-').map(Number);
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
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
