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

interface Env {
  SHEETS_WEBHOOK_URL: string;
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
    extras: { managed: 'Currently managed' },
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
};

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
  if (!type) return json({ ok: false, error: 'Unknown enquiry type.' }, 400);

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

  const extras = Object.entries(type.extras)
    .map(([key, label]) => {
      const raw = get(key);
      if (!raw) return '';
      const value = CHOICES[key] ? CHOICES[key][raw] : raw;
      return value ? `${label}: ${value}` : '';
    })
    .filter(Boolean);
  const message = [extras.length ? `[${extras.join(' | ')}]` : '', payload.message].filter(Boolean).join(' ');

  if (!env.SHEETS_WEBHOOK_URL) {
    return json({ ok: false, error: 'Enquiries are not configured (SHEETS_WEBHOOK_URL missing).' }, 500);
  }

  try {
    const res = await fetch(env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        message,
        source: `apnre agency site / ${type.label}`,
        submittedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`Sheet webhook responded ${res.status}`);
    // Apps Script can answer 200 with an error page, so require the
    // script's own { ok: true } rather than trusting the status.
    const body = await res.json().catch(() => null);
    if (!body || body.ok !== true) {
      throw new Error(`Sheet webhook did not confirm success: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    console.error('Failed to forward enquiry to sheet webhook:', err);
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
