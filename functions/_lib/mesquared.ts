// Forwards an enquiry to MeSquared OS, the platform that answers it within
// minutes (an acknowledgement to the visitor, an alert to the right
// person) and tracks it from there. Server-side, so the intake key never
// reaches the browser; it lives in the Pages project's environment as
// MESQUARED_INTAKE_KEY.
//
// This runs after the Google Sheet post and never changes the visitor's
// outcome: the sheet is the record, MeSquared OS is the follow-up. A
// failure here is logged, not shown.

export interface MeSquaredEnv {
  /** Intake API key issued to this business in MeSquared OS (Settings → API keys, "intake" scope). */
  MESQUARED_INTAKE_KEY?: string;
  /** Override for staging; defaults to the production platform. */
  MESQUARED_INTAKE_URL?: string;
}

export interface MeSquaredEnquiry {
  name: string;
  email: string;
  phone: string;
  /** Property address or room, when the form has one. */
  address?: string;
  message: string;
  /** Which form, e.g. "Sales appraisal"; shown to the team and used to qualify. */
  kind: string;
  /** Where on the site it came from, e.g. "adelaide page". */
  origin?: string;
  /** Extra answers already reduced to "Label: value" strings, or a plain map. */
  fields?: Record<string, string>;
}

const DEFAULT_URL = 'https://os.mesquaredagency.com';
const TIMEOUT_MS = 10_000;

export function meSquaredConfigured(env: MeSquaredEnv): boolean {
  return Boolean(env.MESQUARED_INTAKE_KEY);
}

/** Sends the enquiry; resolves to true when the platform accepted it. Never throws. */
export async function forwardToMeSquared(env: MeSquaredEnv, enquiry: MeSquaredEnquiry): Promise<boolean> {
  if (!env.MESQUARED_INTAKE_KEY) return false;
  const base = (env.MESQUARED_INTAKE_URL || DEFAULT_URL).replace(/\/$/, '');
  const fields: Record<string, string> = { type: enquiry.kind.slice(0, 80), ...(enquiry.origin ? { origin: enquiry.origin.slice(0, 120) } : {}), ...(enquiry.address ? { property: enquiry.address.slice(0, 200) } : {}) };
  for (const [key, value] of Object.entries(enquiry.fields ?? {})) {
    if (Object.keys(fields).length >= 28) break;
    if (value) fields[key.slice(0, 40)] = value.slice(0, 200);
  }
  const body = {
    source: 'WEB_FORM',
    name: enquiry.name,
    email: enquiry.email || undefined,
    phone: enquiry.phone || undefined,
    message: [enquiry.address ? `${enquiry.kind} for ${enquiry.address}.` : `${enquiry.kind}.`, enquiry.message].filter(Boolean).join(' ').slice(0, 5000),
    fields,
  };
  try {
    const res = await fetch(`${base}/api/v1/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.MESQUARED_INTAKE_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`MeSquared OS declined the enquiry: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Could not forward the enquiry to MeSquared OS:', err);
    return false;
  }
}
