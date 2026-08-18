import { businessDayBounds, calendarDateInBusinessTz } from './dates';

describe('businessDayBounds', () => {
  it('uses Pakistan midnight, not UTC midnight', () => {
    const { date, start, end } = businessDayBounds('2026-08-19');
    expect(date).toBe('2026-08-19');
    expect(start.toISOString()).toBe('2026-08-18T19:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-19T18:59:59.999Z');
  });

  it('keeps a 2am PKT entry on the 19th, not the UTC 18th', () => {
    const { start, end } = businessDayBounds('2026-08-19');
    const twoAmPkt = new Date('2026-08-19T02:00:00+05:00');
    expect(twoAmPkt >= start && twoAmPkt <= end).toBe(true);

    const { start: d18Start, end: d18End } = businessDayBounds('2026-08-18');
    expect(twoAmPkt >= d18Start && twoAmPkt <= d18End).toBe(false);
  });

  it('returns today in Asia/Karachi when no date is given', () => {
    expect(businessDayBounds().date).toBe(calendarDateInBusinessTz());
  });
});
