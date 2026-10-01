// Cloudflare Pages Function — receives the appraisal form POST from the
// browser (same-origin, so no CORS headaches) and forwards it server-side
// to a Google Sheet via an Apps Script Web App webhook.
//
// Why a function in the middle instead of pointing the form straight at
// the Apps Script URL?
//   - Keeps the webhook URL out of the client-side bundle.
//   - Gives us one seam to add validation, spam checks, or a second
//     destination (e.g. PropertyMe, once/if a real lead-intake API or
//     partner integration is confirmed with them) without touching the
//     frontend again.
//
// Setup:
//   1. Create the Google Sheet + Apps Script webhook (see
//      docs/google-sheet-lead-webhook.md in this repo for the script).
//   2. In the Cloudflare Pages project settings → Settings → Environment
//      variables, add:
//        SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/XXX/exec
//   3. Deploy. The form already posts to /api/lead (see AppraisalForm.tsx).

import { isEmail, isPhone, json, NOT_CONFIGURED, postToSheet, sheetSafe, turnstileOk } from '../_lib/forms';

interface Env {
  SHEETS_WEBHOOK_URL: string;
  /** Cloudflare Turnstile secret key, shared with functions/api/enquiry.ts.
   *  When set, every submission needs a valid token from the form's
   *  widget (VITE_TURNSTILE_SITE_KEY); see docs/forms.md. */
  TURNSTILE_SECRET?: string;
}

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'address'] as const;

/** Same caps as functions/api/enquiry.ts, so a bot can't post huge rows. */
const MAX_FIELD = 500;
const MAX_MESSAGE = 3000;

// Mirrors OfficeId in src/data/offices.ts.
const KNOWN_OFFICES = ['adelaide', 'mount-gambier'];

// Answers to "Is the property currently managed?" (MANAGED_OPTIONS in
// src/funnels/landlords/components/AppraisalForm.tsx). The answer goes at
// the top of the Message column so switchers stand out in the sheet
// without needing an extra column or an Apps Script change.
const MANAGED_LABELS: Record<string, string> = {
  agent: 'Currently managed by another agent (switching)',
  self: 'Currently self-managed',
  'not-rented': 'Not rented yet',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form submission.' }, 400);
  }

  const get = (key: string, max = MAX_FIELD) => String(formData.get(key) ?? '').trim().slice(0, max);

  // Honeypot: a hidden field that should always be empty for a real
  // visitor. If it's filled, silently pretend success — don't tip off
  // the bot, don't waste a row in the sheet.
  if (get('hp_confirm')) return json({ ok: true });

  if (env.TURNSTILE_SECRET) {
    const ok = await turnstileOk(
      env.TURNSTILE_SECRET,
      get('cf-turnstile-response', 4096),
      request.headers.get('CF-Connecting-IP'),
      'landlord-appraisal',
    );
    if (!ok) return json({ ok: false, error: 'Spam check failed. Please try again.' }, 403);
  }

  const payload: Record<string, string> = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    address: get('address'),
    message: get('message', MAX_MESSAGE),
  };

  // Office pages add a hidden `office` field. Only known values make it
  // into the sheet, so a tampered form can't write arbitrary text there.
  const office = get('office');
  const source = KNOWN_OFFICES.includes(office)
    ? `apnre-website / ${office} page / appraisal form`
    : 'apnre-website / appraisal form';

  const managed = MANAGED_LABELS[get('managed')];
  if (managed) {
    payload.message = payload.message ? `[${managed}] ${payload.message}` : `[${managed}]`;
  }

  const missing = REQUIRED_FIELDS.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return json({ ok: false, error: `Missing required field(s): ${missing.join(', ')}` }, 400);
  }

  if (!isEmail(payload.email)) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (!isPhone(payload.phone)) return json({ ok: false, error: 'Please enter a valid phone number.' }, 400);

  if (!env.SHEETS_WEBHOOK_URL) {
    console.error('SHEETS_WEBHOOK_URL is not set, so the lead was not recorded.');
    return json({ ok: false, error: NOT_CONFIGURED }, 500);
  }

  try {
    await postToSheet(env.SHEETS_WEBHOOK_URL, {
      name: sheetSafe(payload.name),
      email: sheetSafe(payload.email),
      phone: payload.phone,
      address: sheetSafe(payload.address),
      message: sheetSafe(payload.message),
      source,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to forward lead to sheet webhook:', err);
    return json({ ok: false, error: 'Could not record submission. Please try again.' }, 502);
  }

  return json({ ok: true });
};
