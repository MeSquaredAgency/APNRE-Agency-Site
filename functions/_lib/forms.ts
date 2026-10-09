// Helpers shared by the form endpoints (functions/api/enquiry.ts and
// lead.ts). This file exports no request handlers, so Pages doesn't serve
// it as a route.

/** Hosts a Turnstile token may come from. Preview deployments
 *  (*.pages.dev) are allowed too, so forms can be tested there. */
const TURNSTILE_HOSTS = new Set(['apnre.com.au', 'www.apnre.com.au']);

/** How long to wait for Google before giving up, so a slow Apps Script
 *  can't hold the visitor's request open. */
const WEBHOOK_TIMEOUT_MS = 10_000;

/** Checks a Turnstile token with Cloudflare, including that it was issued
 *  on one of APN's sites and, when given, for this form. */
export async function turnstileOk(
  secret: string,
  token: string,
  ip: string | null,
  action?: string,
): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    const result = (await res.json()) as { success?: boolean; hostname?: string; action?: string };
    if (result.success !== true) return false;
    const host = result.hostname ?? '';
    if (!TURNSTILE_HOSTS.has(host) && !host.endsWith('.pages.dev')) return false;
    if (action && result.action !== action) return false;
    return true;
  } catch (err) {
    console.error('Turnstile verification failed:', err);
    return false;
  }
}

/** Google Sheets reads a cell starting with = + - or @ as a formula, so a
 *  visitor could plant one (e.g. =HYPERLINK to a phishing site) in a row
 *  staff will open. A leading apostrophe makes Sheets store it as plain
 *  text and isn't shown in the cell. Phone numbers are left alone here:
 *  the Apps Script stores that column as text (docs/forms.md). */
export function sheetSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** A loose check that catches typos and junk, not a full RFC parser. */
export function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** 8 to 15 digits once spaces, brackets, + and dashes are ignored, so
 *  every common format passes (0412 345 678, +61 412 345 678,
 *  08 8123 4567) and junk doesn't. */
export function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '').length;
  return digits >= 8 && digits <= 15 && !/[^0-9 ()+\-]/.test(value);
}

/** Posts a row to the Apps Script webhook. Throws unless the script
 *  confirms it saved the row: Apps Script can answer 200 with an error
 *  page (a renamed tab, a stale deployment), so the status alone isn't
 *  proof. */
export async function postToSheet(webhookUrl: string, row: Record<string, unknown>): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Sheet webhook responded ${res.status}`);
  const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  if (!body || body.ok !== true) {
    throw new Error(`Sheet webhook did not confirm success: ${JSON.stringify(body)}`);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Shown to the visitor when the site isn't set up to take enquiries.
 *  The detail goes to the logs, not the browser. */
export const NOT_CONFIGURED = 'Enquiries can’t be sent right now. Please call us on 1300 123 276.';
