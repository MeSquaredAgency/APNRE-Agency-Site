// The podcast room's Google Calendar, "APN Podcast Room", read through
// the leads sheet's Apps Script (docs/lead-notifications.md), which also
// writes to it: every podcast room request becomes a "Requested" hold,
// and staff delete the hold to free the session or add phone bookings
// by hand. /api/podcast-availability uses this to grey out taken
// sessions on /office-space/, and /api/enquiry to turn away a request
// for one. See docs/office-space.md.
//
// The script answers GET <SHEETS_WEBHOOK_URL>?action=podcast-availability
// with the calendar's events over the booking window. Until the updated
// script is deployed that request fails, and the page falls back to "we'll
// confirm the date is free". This file exports no request handlers, so
// Pages doesn't serve it as a route.

import { PODCAST_SESSIONS, type SessionId } from '../../src/data/office-space';
import { addDays, adelaideParts, adelaideToday, isIsoDate, lastBookableDate } from '../../src/lib/bookings';

/** Taken sessions by Adelaide date, e.g. { '2026-10-05': ['am', 'day'] }. */
export type BookedSessions = Record<string, SessionId[]>;

/** One event, as the Apps Script sends it. Timed events are UTC instants;
 *  all-day events are a calendar date and a number of days. */
export type CalendarEvent =
  | { allDay: false; start: string; end: string }
  | { allDay: true; start: string; days: number };

/** Apps Script takes a second or two to answer, so the page's lookups
 *  share one answer for this long. Booking requests always ask afresh. */
const CACHE_SECONDS = 60;
const CACHE_KEY = 'https://podcast-availability.internal/v1';

export async function bookedSessions(
  webhookUrl: string,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<BookedSessions> {
  const cache = (caches as unknown as { default: Cache }).default;
  let res = fresh ? undefined : await cache.match(CACHE_KEY);
  if (!res) {
    const url = new URL(webhookUrl);
    url.searchParams.set('action', 'podcast-availability');
    const live = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!live.ok) throw new Error(`Calendar lookup responded ${live.status}`);
    res = new Response(await live.text(), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${CACHE_SECONDS}` },
    });
    await cache.put(CACHE_KEY, res.clone());
  }
  // An old script without the calendar answers with an HTML error page.
  const body = (await res.json().catch(() => null)) as { ok?: boolean; events?: CalendarEvent[] } | null;
  if (!body?.ok || !Array.isArray(body.events)) throw new Error('Calendar lookup gave no events');
  return sessionsFromEvents(body.events, adelaideToday());
}

/** Which sessions each event covers, from today to the end of the
 *  booking window. */
export function sessionsFromEvents(events: CalendarEvent[], today: string): BookedSessions {
  const last = lastBookableDate(today);
  const booked: Record<string, Set<SessionId>> = {};
  const block = (date: string, from: number, to: number) => {
    if (date < today || date > last) return;
    for (const s of PODCAST_SESSIONS) {
      if (from < s.end && to > s.start) (booked[date] ??= new Set()).add(s.id);
    }
  };

  for (const event of events) {
    if (event.allDay) {
      if (!isIsoDate(event.start)) continue;
      const days = Math.min(Math.max(1, Math.round(event.days) || 1), 400);
      for (let i = 0; i < days; i++) block(addDays(event.start, i), 0, 24 * 60);
      continue;
    }
    const startAt = new Date(event.start);
    const endAt = new Date(event.end);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) continue;
    const start = adelaideParts(startAt);
    const end = adelaideParts(endAt);
    // Each day the event touches, and the part of it that's covered.
    for (let date = start.date; date <= end.date && date <= last; date = addDays(date, 1)) {
      const from = date === start.date ? start.minutes : 0;
      const to = date === end.date ? end.minutes : 24 * 60;
      block(date, from, to);
    }
  }

  return Object.fromEntries(Object.entries(booked).map(([date, ids]) => [date, [...ids]]));
}
