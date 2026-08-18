/** Pakistan Standard Time — shop calendar for Roznamcha (no DST). */
export const BUSINESS_TZ = 'Asia/Karachi';
const BUSINESS_OFFSET = '+05:00';

export function isCalendarDate(value?: string): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** YYYY-MM-DD in the shop timezone, not the server's local clock. */
export function calendarDateInBusinessTz(at = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/**
 * Inclusive start/end instants for a shop calendar day.
 * Render runs in UTC; a local Mac often runs in PKT — using this keeps
 * both environments on the same day buckets.
 */
export function businessDayBounds(dateInput?: string): {
  date: string;
  start: Date;
  end: Date;
} {
  const date = isCalendarDate(dateInput) ? dateInput : calendarDateInBusinessTz();
  return {
    date,
    start: new Date(`${date}T00:00:00.000${BUSINESS_OFFSET}`),
    end: new Date(`${date}T23:59:59.999${BUSINESS_OFFSET}`),
  };
}
