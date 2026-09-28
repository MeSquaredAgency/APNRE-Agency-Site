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

interface Env {
  SHEETS_WEBHOOK_URL: string;
}

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'address'] as const;

// Mirrors OfficeId in src/data/offices.ts.
const KNOWN_OFFICES = ['adelaide', 'mount-gambier'];

// Answers to "Is the property currently managed?" (MANAGED_OPTIONS in
// src/components/AppraisalForm.tsx). The answer goes at the top of the
// Message column so switchers stand out in the sheet without needing an
// extra column or an Apps Script change.
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

  const payload: Record<string, string> = {};
  for (const field of ['name', 'email', 'phone', 'address', 'message'] as const) {
    payload[field] = String(formData.get(field) ?? '').trim();
  }

  // Honeypot: a hidden field that should always be empty for a real
  // visitor. If it's filled, silently pretend success — don't tip off
  // the bot, don't waste a row in the sheet.
  const honeypot = String(formData.get('hp_confirm') ?? '').trim();
  if (honeypot) {
    return json({ ok: true });
  }

  // Office pages add a hidden `office` field. Only known values make it
  // into the sheet, so a tampered form can't write arbitrary text there.
  const office = String(formData.get('office') ?? '').trim();
  const source = KNOWN_OFFICES.includes(office)
    ? `apnre-website / ${office} page / appraisal form`
    : 'apnre-website / appraisal form';

  const managed = MANAGED_LABELS[String(formData.get('managed') ?? '').trim()];
  if (managed) {
    payload.message = payload.message ? `[${managed}] ${payload.message}` : `[${managed}]`;
  }

  const missing = REQUIRED_FIELDS.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return json({ ok: false, error: `Missing required field(s): ${missing.join(', ')}` }, 400);
  }

  if (!env.SHEETS_WEBHOOK_URL) {
    return json({ ok: false, error: 'Lead intake is not configured (SHEETS_WEBHOOK_URL missing).' }, 500);
  }

  try {
    const sheetRes = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        source,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!sheetRes.ok) {
      throw new Error(`Sheet webhook responded ${sheetRes.status}`);
    }

    // Apps Script web apps can return HTTP 200 with an error page/body
    // (e.g. an uncaught exception inside doPost — a renamed sheet tab,
    // a stale deployed version) rather than a proper non-2xx status. A
    // status-only check would treat that as success and tell the
    // browser the lead was recorded when nothing was actually written.
    // Require the expected { ok: true } body instead of trusting status
    // alone.
    const sheetBody = await sheetRes.json().catch(() => null);
    if (!sheetBody || sheetBody.ok !== true) {
      throw new Error(`Sheet webhook did not confirm success: ${JSON.stringify(sheetBody)}`);
    }
  } catch (err) {
    console.error('Failed to forward lead to sheet webhook:', err);
    return json({ ok: false, error: 'Could not record submission. Please try again.' }, 502);
  }

  return json({ ok: true });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
