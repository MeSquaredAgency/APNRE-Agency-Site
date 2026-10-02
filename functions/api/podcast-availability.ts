// GET /api/podcast-availability: which podcast room sessions are already
// held or booked, for the calendar on /office-space/. Read from the "APN
// Podcast Room" Google Calendar through the leads sheet's Apps Script
// (functions/_lib/podcast-calendar.ts).
//
//   { ok: true, live: true, booked: { '2026-10-05': ['am', 'day'] } }
//   { ok: true, live: false, booked: {} }   calendar not set up yet
//
// When it isn't live, the page still takes requests and says the team
// will confirm the date is free.

import { json } from '../_lib/forms';
import { bookedSessions } from '../_lib/podcast-calendar';

interface Env {
  SHEETS_WEBHOOK_URL?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.SHEETS_WEBHOOK_URL) return json({ ok: true, live: false, booked: {} });
  try {
    const res = json({ ok: true, live: true, booked: await bookedSessions(env.SHEETS_WEBHOOK_URL) });
    res.headers.set('Cache-Control', 'public, max-age=60');
    return res;
  } catch (err) {
    // Most likely the sheet's script hasn't been updated with the
    // calendar code yet (docs/lead-notifications.md).
    console.warn('Podcast room calendar unavailable:', err);
    return json({ ok: true, live: false, booked: {} });
  }
};
