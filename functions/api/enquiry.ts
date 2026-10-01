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
import { isEmail, isPhone, json, NOT_CONFIGURED, postToSheet, sheetSafe, turnstileOk } from '../_lib/forms';

interface Env {
  SHEETS_WEBHOOK_URL: string;
  /** Cloudflare Turnstile secret key. When set, every submission needs a
   *  valid token, so only set it together with VITE_TURNSTILE_SITE_KEY
   *  (otherwise the forms can't produce one and every enquiry fails). */
  TURNSTILE_SECRET?: string;
}

interface EnquiryType {
  /** Shown in the sheet's Source column, so each type can be filtered. */
  label: string;
  /** Fields that must be filled in, on top of name/email/phone. */
  required: string[];
  /** Extra fields folded into the Message column as "Label: value". */
  extras: Record<string, string>;
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
    });
  } catch (err) {
    console.error('Failed to forward enquiry to sheet webhook:', err);
    return json({ ok: false, error: 'Could not record submission. Please try again.' }, 502);
  }

  return json({ ok: true });
};
