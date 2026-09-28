import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { trackFormSubmit } from '../lib/analytics';
import { loadTurnstile, TURNSTILE_SITE_KEY } from '../lib/turnstile';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';

// Posts to functions/api/enquiry.ts, which forwards to the Google Sheet.
const ENDPOINT = '/api/enquiry';

/** Keys must match TYPES in functions/api/enquiry.ts. */
export type EnquiryKind =
  | 'sales-appraisal'
  | 'rental-appraisal'
  | 'buyer-register'
  | 'tenant-register'
  | 'general'
  | 'careers'
  | 'maintenance';

interface EnquiryFormProps {
  kind: EnquiryKind;
  submitLabel: string;
  /** Prefill for the address field (e.g. typed into the home hero). */
  defaultAddress?: string;
  /** Rendered above the fields, e.g. the sales/rental switch. */
  before?: ReactNode;
}

type Status = 'idle' | 'submitting' | 'error';

export default function EnquiryForm({ kind, submitLabel, defaultAddress, before }: EnquiryFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [managed, setManaged] = useState('');

  // Turnstile spam check, when a site key is configured. The widget adds
  // a hidden cf-turnstile-response field to this form, which
  // functions/api/enquiry.ts verifies. Usually invisible; it only asks
  // for a click when Cloudflare isn't sure the visitor is human.
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string>();
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileBox.current) return;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !turnstileBox.current) return;
        turnstileId.current = ts.render(turnstileBox.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: kind,
          appearance: 'interaction-only',
        });
      })
      .catch((err) => console.warn(err));
    return () => {
      cancelled = true;
      if (turnstileId.current) window.turnstile?.remove(turnstileId.current);
      turnstileId.current = undefined;
    };
  }, [kind]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    setStatus('submitting');
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body: new FormData(form) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || body.ok !== true) {
        throw new Error(`Submission not confirmed (${res.status}): ${JSON.stringify(body)}`);
      }
      trackFormSubmit(kind, () => {
        window.location.href = `/thank-you/?type=${kind}`;
      });
    } catch (err) {
      console.error('Enquiry form submission failed:', err);
      // Turnstile tokens are single-use, so get a fresh one for the retry.
      if (turnstileId.current) window.turnstile?.reset(turnstileId.current);
      setStatus('error');
    }
  }

  const needsAddress = kind === 'sales-appraisal' || kind === 'rental-appraisal' || kind === 'maintenance';

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {before}

      {/* Honeypot. Deliberately not named like a real field: browser
          autofill ignores CSS hiding and would fill a field called
          "company" or "website", silently dropping real enquiries. */}
      <div className="form__honeypot" aria-hidden="true">
        <label>
          Leave this field blank
          <input type="text" name="hp_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="type" value={kind} />

      <label className="form__field">
        <span>Name*</span>
        <input type="text" name="name" required autoComplete="name" />
      </label>

      <div className="form__split">
        <label className="form__field">
          <span>Email*</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label className="form__field">
          <span>Phone*</span>
          <input type="tel" name="phone" required autoComplete="tel" />
        </label>
      </div>

      {needsAddress && (
        <label className="form__field">
          <span>{kind === 'maintenance' ? 'Rental property address*' : 'Property address*'}</span>
          <input
            type="text"
            name="address"
            required
            autoComplete="street-address"
            defaultValue={defaultAddress}
          />
        </label>
      )}

      {kind === 'sales-appraisal' && (
        <label className="form__field">
          <span>When are you thinking of selling?</span>
          <select name="timeframe" defaultValue="">
            <option value="">Choose one (optional)</option>
            <option>As soon as possible</option>
            <option>In the next 3 months</option>
            <option>In 3–12 months</option>
            <option>Just curious about value</option>
          </select>
        </label>
      )}

      {kind === 'rental-appraisal' && (
        <fieldset className="form__choice">
          <legend>How can we help? (choose any)</legend>
          <div className="form__checks">
            {/* Values must match HELP_OPTIONS in functions/api/enquiry.ts. */}
            {[
              ['appraisal', 'A rental appraisal'],
              ['switching', 'Changing property managers'],
              ['new-investment', 'Leasing a new investment'],
              ['advice', 'General advice'],
            ].map(([value, label]) => (
              <label key={value}>
                <input type="checkbox" name="help" value={value} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {kind === 'rental-appraisal' && (
        <fieldset className="form__choice">
          <legend>Is the property currently managed?</legend>
          <div className="form__choice-options">
            {[
              ['agent', 'Yes, by another agent'],
              ['self', 'No, I manage it myself'],
              ['not-rented', 'No, it isn’t rented yet'],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="managed"
                  value={value}
                  checked={managed === value}
                  onChange={() => setManaged(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {managed === 'agent' && (
            <p className="form__note">
              We’ll explain how changing over works, including while the property is tenanted.
            </p>
          )}
        </fieldset>
      )}

      {(kind === 'buyer-register' || kind === 'tenant-register') && (
        <>
          <label className="form__field">
            <span>Suburbs you’re interested in</span>
            <input type="text" name="suburbs" placeholder="e.g. Blair Athol, Enfield, Prospect" />
          </label>
          <div className="form__split">
            <label className="form__field">
              <span>{kind === 'buyer-register' ? 'Budget' : 'Weekly budget'}</span>
              <input
                type="text"
                name="budget"
                placeholder={kind === 'buyer-register' ? 'e.g. up to $700k' : 'e.g. $550'}
              />
            </label>
            <label className="form__field">
              <span>Bedrooms</span>
              <select name="bedrooms" defaultValue="">
                <option value="">Any</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
                <option>4+</option>
              </select>
            </label>
          </div>
          {kind === 'tenant-register' && (
            <label className="form__field">
              <span>When do you need to move?</span>
              <input type="text" name="moveDate" placeholder="e.g. early November" />
            </label>
          )}
        </>
      )}

      {(kind === 'general' || kind === 'careers') && (
        <div className="form__split">
          {kind === 'general' ? (
            <label className="form__field">
              <span>What’s it about?</span>
              <select name="topic" defaultValue="">
                <option value="">Choose one (optional)</option>
                <option>Selling</option>
                <option>Buying</option>
                <option>Property management</option>
                <option>Renting</option>
                <option>Something else</option>
              </select>
            </label>
          ) : (
            <label className="form__field">
              <span>Area of interest</span>
              <select name="role" defaultValue="">
                <option value="">Choose one (optional)</option>
                <option>Sales</option>
                <option>Property management</option>
                <option>Administration</option>
                <option>Not sure yet</option>
              </select>
            </label>
          )}
          <label className="form__field">
            <span>Nearest office</span>
            <select name="office" defaultValue="">
              <option value="">Either</option>
              <option value="adelaide">Adelaide</option>
              <option value="mount-gambier">Mount Gambier</option>
            </select>
          </label>
        </div>
      )}

      {kind === 'maintenance' && (
        <div className="form__split">
          <label className="form__field">
            <span>How urgent is it?</span>
            <select name="urgency" defaultValue="Routine">
              <option>Routine</option>
              <option>Needs attention this week</option>
            </select>
          </label>
          <label className="form__field">
            <span>Can a tradesperson enter if you’re out?</span>
            <select name="access" defaultValue="">
              <option value="">Please contact me first</option>
              <option>Yes, they can enter</option>
            </select>
          </label>
        </div>
      )}

      <label className="form__field">
        <span>
          {kind === 'maintenance'
            ? 'What needs fixing?*'
            : kind === 'careers'
              ? 'Tell us a little about yourself'
              : 'Anything else we should know? (optional)'}
        </span>
        <textarea name="message" rows={4} required={kind === 'maintenance'} />
      </label>

      {TURNSTILE_SITE_KEY && <div ref={turnstileBox} className="form__turnstile" />}

      {status === 'error' && (
        <p className="form__error" role="alert">
          Something went wrong sending this. Please try again, or call us on{' '}
          <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>.
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : submitLabel}
      </button>
      <p className="form__fineprint">
        * Required. We use your details to respond to this enquiry. See our{' '}
        <a href="/privacy/">Privacy Policy</a>.
      </p>
    </form>
  );
}
