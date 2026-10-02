// Date helpers for the /office-space/ booking forms, shared with
// functions/api/enquiry.ts and functions/_lib/podcast-calendar.ts so the
// browser and the server agree on which days can be booked.
//
// Dates are ISO strings ('2026-10-05') in Adelaide time. Arithmetic is
// done on them as UTC midnights, which never shift with daylight saving.

import { PODCAST_BOOKING_WEEKS } from '../data/office-space';

const TIME_ZONE = 'Australia/Adelaide';

/** Today's date in Adelaide. */
export function adelaideToday(now = new Date()): string {
  return adelaideParts(now).date;
}

/** An instant as an Adelaide date and minutes after midnight. */
export function adelaideParts(instant: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

const asUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(asUtc(value).getTime()) && asUtc(value).toISOString().startsWith(value);
}

export function addDays(iso: string, days: number): string {
  const d = asUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(iso: string): number {
  return asUtc(iso).getUTCDay();
}

/** "Mon 5 Oct 2026". */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Intl.DateTimeFormat('en-AU', { ...opts, timeZone: 'UTC' }).format(asUtc(iso));
}

/** The last day the podcast room can be booked online. */
export function lastBookableDate(today: string): string {
  return addDays(today, PODCAST_BOOKING_WEEKS * 7);
}

/** The earliest start for an office lease: today, or the day that
 *  office comes free. */
export function earliestLeaseStart(today: string, availableFrom?: string): string {
  return availableFrom && availableFrom > today ? availableFrom : today;
}

/** Leases can be requested to start up to a year ahead. */
export function latestLeaseStart(today: string): string {
  return addDays(today, 365);
}

/** The podcast room is hired Monday to Saturday (office hours), from
 *  tomorrow, up to PODCAST_BOOKING_WEEKS ahead. */
export function isBookableDate(iso: string, today: string): boolean {
  return isIsoDate(iso) && iso > today && iso <= lastBookableDate(today) && weekday(iso) !== 0;
}

/** The first day the podcast room can be booked: tomorrow, or Monday
 *  if tomorrow is a Sunday. */
export function firstBookableDate(today: string): string {
  const tomorrow = addDays(today, 1);
  return weekday(tomorrow) === 0 ? addDays(tomorrow, 1) : tomorrow;
}

export interface CalendarMonth {
  /** '2026-10' */
  key: string;
  /** 'October 2026' */
  label: string;
  /** Rows of Monday to Saturday. null is a day in another month. */
  weeks: (string | null)[][];
}

/** Each month the podcast room can be booked in, laid out Monday to
 *  Saturday for the calendar. */
export function bookingMonths(today: string): CalendarMonth[] {
  const last = lastBookableDate(today);
  const months: CalendarMonth[] = [];
  for (let first = `${firstBookableDate(today).slice(0, 7)}-01`; first <= last; ) {
    const key = first.slice(0, 7);
    const weeks: (string | null)[][] = [];
    for (let monday = addDays(first, -((weekday(first) + 6) % 7)); monday.slice(0, 7) <= key; monday = addDays(monday, 7)) {
      const row = [0, 1, 2, 3, 4, 5].map((i) => addDays(monday, i)).map((d) => (d.slice(0, 7) === key ? d : null));
      // A month starting on a Sunday would otherwise open with an empty row.
      if (row.some(Boolean)) weeks.push(row);
    }
    months.push({ key, label: formatDate(first, { month: 'long', year: 'numeric' }), weeks });
    const next = asUtc(first);
    next.setUTCMonth(next.getUTCMonth() + 1);
    first = next.toISOString().slice(0, 10);
  }
  return months;
}
