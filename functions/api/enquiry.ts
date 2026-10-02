// Cloudflare Pages Function — receives every form on the site (same
// origin, so no CORS) and forwards it server-side to a Google Sheet via
// an Apps Script Web App webhook. Uses the same sheet columns as the
// landlord landing page's /api/lead, so both sites can write to one
// sheet: Timestamp | Name | Email | Phone | Address | Message | Source.
// See docs/forms.md for setup.
//
// Why a function in the middle instead of posting straight to Apps
// Script? It keeps the webhook URL out of the browser bundle, and it's
// one place to add validation, spam checks or a CRM push later.

import { MAINTENANCE_FORM_ENABLED } from '../../src/data/business';
import {
  ANY_OFFICE,
  LEASABLE_OFFICES,
  LEASE_TERMS,
  OFFICE_PEOPLE,
  OFFICE_SPACE_ADDRESS,
  PODCAST_ROOM,
  PODCAST_SESSIONS,
  roomSize,
  sessionRate,
} from '../../src/data/office-space';
import {
  addDays,
  adelaideToday,
  earliestLeaseStart,
  formatDate,
  isBookableDate,
  isIsoDate,
  latestLeaseStart,
} from '../../src/lib/bookings';
import { isEmail, isPhone, json, NOT_CONFIGURED, postToSheet, sheetSafe, turnstileOk } from '../_lib/forms';
import { bookedSessions } from '../_lib/podcast-calendar';

interface Env {
  SHEETS_WEBHOOK_URL: string;
  /** Cloudflare Turnstile secret key. When set, every submission needs a
   *  valid token, so only set it together with VITE_TURNSTILE_SITE_KEY
   *  (otherwise the forms can't produce one and every enquiry fails). */
  TURNSTILE_SECRET?: string;
}

type Get = (key: string, max?: number) => string;

/** A podcast room session for the sheet's script to hold in the room's
 *  calendar (docs/lead-notifications.md). Adelaide date and times. */
interface Booking {
  room: string;
  date: string;
  start: string;
  end: string;
  session: string;
}

/** What a type's own check found: an error for the visitor, or the
 *  Address column and "Label: value" details for the Message column
 *  (and, for the podcast room, the session to hold). */
type Prepared =
  | { error: string; status?: number }
  | { address: string; details: string[]; booking?: Booking };

interface EnquiryType {
  /** Shown in the sheet's Source column, so each type can be filtered. */
  label: string;
  /** Fields that must be filled in, on top of name/email/phone. */
  required: string[];
  /** Extra fields folded into the Message column as "Label: value". */
  extras: Record<string, string>;
  /** Checks the fields the generic rules can't, before anything else is
   *  checked, and sets the address server-side. */
  prepare?: (get: Get, env: Env) => Promise<Prepared>;
}

/** /office-space/: a 6–12 month lease on one of the available offices
 *  in src/data/office-space.ts, or "any" (not sure yet, or the waitlist
 *  once they're all leased). */
async function prepareOfficeLease(get: Get): Promise<Prepared> {
  const roomId = get('room');
  const room = LEASABLE_OFFICES.find((r) => r.id === roomId);
  if (!room && roomId !== ANY_OFFICE) return { error: 'Please choose one of the available offices.' };
  if (!LEASE_TERMS.some((t) => t.value === get('term'))) return { error: 'Please choose a lease term.' };
  const start = get('start');
  // A day's grace either side, for a visitor whose page was loaded on
  // the other side of midnight.
  const today = adelaideToday();
  const earliest = earliestLeaseStart(addDays(today, -1), room?.availableFrom);
  if (!isIsoDate(start) || start < earliest || start > addDays(latestLeaseStart(today), 1)) {
    return {
      error:
        room?.availableFrom && room.availableFrom > today
          ? `${room.name} is available from ${formatDate(room.availableFrom)}. Please choose a start date from then.`
          : 'Please choose a start date within the next year.',
    };
  }
  const name = room ? room.name : LEASABLE_OFFICES.length ? 'Not sure yet' : 'Next available office (waitlist)';
  const size = room ? roomSize(room) : '';
  return {
    address: `${room ? room.name : 'Any office'}${size ? ` (${size})` : ''}, ${OFFICE_SPACE_ADDRESS}`,
    details: [`Office: ${name}`, `Preferred start: ${formatDate(start)}`],
  };
}

/** "08:30" from minutes after midnight. */
const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** /office-space/: the podcast room for 2 hours, a half day or a day.
 *  Turned away if the room's calendar already has that session held or
 *  booked; if the calendar can't be read, it goes through and staff
 *  check. The sheet's script then holds the session in the calendar. */
async function preparePodcastHire(get: Get, env: Env): Promise<Prepared> {
  const date = get('hireDate');
  const session = PODCAST_SESSIONS.find((s) => s.id === get('session'));
  if (!isBookableDate(date, adelaideToday())) return { error: 'Please choose an available date.' };
  if (!session) return { error: 'Please choose a session.' };
  if (env.SHEETS_WEBHOOK_URL) {
    try {
      const booked = await bookedSessions(env.SHEETS_WEBHOOK_URL, { fresh: true });
      if (booked[date]?.includes(session.id)) {
        return { error: 'That session has just been booked. Please choose another.', status: 409 };
      }
    } catch (err) {
      console.warn('Could not check the podcast room calendar; taking the request anyway:', err);
    }
  }
  return {
    address: `${PODCAST_ROOM.name}, ${OFFICE_SPACE_ADDRESS}`,
    details: [
      `Date: ${formatDate(date)}`,
      `Session: ${session.label} (${session.time})`,
      `Price: $${sessionRate(session)} incl. GST`,
    ],
    booking: {
      room: PODCAST_ROOM.name,
      date,
      start: clock(session.start),
      end: clock(session.end),
      session: `${session.label} (${session.time})`,
    },
  };
}

// Keys must match EnquiryKind in src/components/EnquiryForm.tsx.
const TYPES: Record<string, EnquiryType> = {
  'sales-appraisal': {
    label: 'Sales appraisal',
    required: ['address'],
    extras: { timeframe: 'Selling timeframe' },
  },
  'rental-appraisal': {
    label: 'Rental appraisal',
    required: ['address'],
    extras: { help: 'Wants help with', managed: 'Currently managed' },
  },
  'buyer-register': {
    label: 'Buyer register',
    required: [],
    extras: { suburbs: 'Suburbs', budget: 'Budget', bedrooms: 'Bedrooms' },
  },
  'tenant-register': {
    label: 'Tenant register',
    required: [],
    extras: { suburbs: 'Suburbs', budget: 'Weekly budget', bedrooms: 'Bedrooms', moveDate: 'Move date' },
  },
  general: {
    label: 'General enquiry',
    required: [],
    extras: { topic: 'Topic', office: 'Office' },
  },
  careers: {
    label: 'Careers expression of interest',
    required: [],
    extras: { role: 'Area of interest', office: 'Office' },
  },
  maintenance: {
    label: 'Maintenance request',
    required: ['address', 'message'],
    extras: { urgency: 'Urgency', access: 'Access' },
  },
  // From a property's own page (src/pages/Listing.tsx): the address and
  // PropertyMe listing ID come from hidden fields.
  listing: {
    label: 'Listing enquiry',
    required: ['address'],
    extras: { listing: 'Listing ID' },
  },
  // /office-space/ (src/pages/OfficeSpace.tsx). The address is set from
  // the chosen room, never taken from the form.
  'office-lease': {
    label: 'Office space lease',
    required: ['address'],
    extras: { term: 'Term', people: 'People', business: 'Business' },
    prepare: prepareOfficeLease,
  },
  'podcast-hire': {
    label: 'Podcast room hire',
    required: ['address'],
    extras: { business: 'Business or show' },
    prepare: preparePodcastHire,
  },
};

// Values allowed for the choice fields, so a tampered form can't write
// arbitrary text into them. Free-text extras (suburbs etc.) are trimmed
// and length-capped instead.
const CHOICES: Record<string, Record<string, string>> = {
  managed: {
    agent: 'Yes, by another agent (switching)',
    self: 'No, self-managed',
    'not-rented': 'Not rented yet',
  },
  office: { adelaide: 'Adelaide', 'mount-gambier': 'Mount Gambier' },
  term: Object.fromEntries(LEASE_TERMS.map((t) => [t.value, t.label])),
  people: Object.fromEntries(OFFICE_PEOPLE.map((p) => [p, p])),
  // Checkboxes: several can be ticked (see MULTI below).
  help: {
    appraisal: 'Rental appraisal',
    switching: 'Changing property managers',
    'new-investment': 'Leasing a new investment',
    advice: 'General advice',
  },
};

/** Choice fields sent as several values (checkboxes). */
const MULTI = new Set(['help']);

const MAX_FIELD = 500;
const MAX_MESSAGE = 3000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form submission.' }, 400);
  }

  const get = (key: string, max = MAX_FIELD) => String(form.get(key) ?? '').trim().slice(0, max);

  // Honeypot: hidden from real visitors. If it's filled, pretend success
  // so the bot doesn't retry, and don't write a row.
  if (get('hp_confirm')) return json({ ok: true });

  const typeKey = get('type');
  const type = TYPES[typeKey];
  // The repairs form stays switched off until someone checks those rows
  // every business day (MAINTENANCE_FORM_ENABLED), so a hand-made post
  // can't create one either.
  if (!type || (typeKey === 'maintenance' && !MAINTENANCE_FORM_ENABLED)) {
    return json({ ok: false, error: 'Unknown enquiry type.' }, 400);
  }

  if (env.TURNSTILE_SECRET) {
    const ok = await turnstileOk(
      env.TURNSTILE_SECRET,
      get('cf-turnstile-response', 4096),
      request.headers.get('CF-Connecting-IP'),
      typeKey, // the form renders its widget with action = its type
    );
    if (!ok) return json({ ok: false, error: 'Spam check failed. Please try again.' }, 403);
  }

  const payload = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    address: get('address'),
    message: get('message', MAX_MESSAGE),
  };

  let details: string[] = [];
  let booking: Booking | undefined;
  if (type.prepare) {
    const prepared = await type.prepare(get, env);
    if ('error' in prepared) return json({ ok: false, error: prepared.error }, prepared.status ?? 400);
    payload.address = prepared.address;
    details = prepared.details;
    booking = prepared.booking;
  }

  const missing = ['name', 'email', 'phone', ...type.required].filter(
    (field) => !payload[field as keyof typeof payload],
  );
  if (missing.length > 0) {
    return json({ ok: false, error: `Missing required field(s): ${missing.join(', ')}` }, 400);
  }

  if (!isEmail(payload.email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!isPhone(payload.phone)) return json({ ok: false, error: 'Please enter a valid phone number.' }, 400);

  const extras = Object.entries(type.extras)
    .map(([key, label]) => {
      if (MULTI.has(key)) {
        const values = form
          .getAll(key)
          .map((v) => CHOICES[key][String(v)])
          .filter(Boolean);
        return values.length ? `${label}: ${[...new Set(values)].join(', ')}` : '';
      }
      const raw = get(key);
      if (!raw) return '';
      const value = CHOICES[key] ? CHOICES[key][raw] : raw;
      return value ? `${label}: ${value}` : '';
    })
    .filter(Boolean);
  extras.unshift(...details);
  const message = [extras.length ? `[${extras.join(' | ')}]` : '', payload.message].filter(Boolean).join(' ');

  if (!env.SHEETS_WEBHOOK_URL) {
    console.error('SHEETS_WEBHOOK_URL is not set, so the enquiry was not recorded.');
    return json({ ok: false, error: NOT_CONFIGURED }, 500);
  }

  try {
    await postToSheet(env.SHEETS_WEBHOOK_URL, {
      name: sheetSafe(payload.name),
      email: sheetSafe(payload.email),
      phone: payload.phone,
      address: sheetSafe(payload.address),
      message: sheetSafe(message),
      source: `apnre agency site / ${type.label}`,
      submittedAt: new Date().toISOString(),
      // Not a sheet column: the script holds this session in the podcast
      // room's calendar. Older scripts ignore it.
      ...(booking ? { booking } : {}),
    });
  } catch (err) {
    console.error('Failed to forward enquiry to sheet webhook:', err);
    return json({ ok: false, error: 'Could not record submission. Please try again.' }, 502);
  }

  return json({ ok: true });
};
