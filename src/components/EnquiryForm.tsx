import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { trackFormSubmit } from '../lib/analytics';
import { loadTurnstile, TURNSTILE_SITE_KEY } from '../lib/turnstile';
import AddressInput from './AddressInput';
import { OPENING_HOURS, PHONE_DISPLAY, PHONE_TEL } from '../data/business';

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
  | 'maintenance'
  | 'listing'
  | 'office-lease'
  | 'podcast-hire';

interface EnquiryFormProps {
  kind: EnquiryKind;
  submitLabel: string;
  /** Prefill for the address field (e.g. typed into the home hero). */
  defaultAddress?: string;
  /** Rendered above the fields, e.g. the sales/rental switch. */
  before?: ReactNode;
  /** Preselects "What's it about?" on the general form, e.g. on a hub page. */
  defaultTopic?: string;
  /** The property a 'listing' enquiry is about (src/pages/Listing.tsx). */
  listing?: { id: string; address: string };
  /** Fields of the page's own, at the top of the form under the
   *  required-fields note (e.g. the office booking choices). */
  choices?: ReactNode;
  /** Heading between `choices` and the contact fields. */
  detailsHeading?: string;
}

type Status = 'idle' | 'submitting' | 'error';

/** What to say under a field the browser has flagged as invalid. */
function fieldError(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const v = field.validity;
  const label = field.dataset.label ?? 'This field';
  // A radio group's data-label reads as an object: "an office".
  if (v.valueMissing && field.type === 'radio') return `Choose ${label}.`;
  if (v.valueMissing) return `${label} is required.`;
  if (field.name === 'email') return 'Enter an email address like name@example.com.';
  if (field.name === 'phone') return 'Enter a number we can call, e.g. 0412 345 678 or 08 8123 4567.';
  return field.validationMessage;
}

/** Marks every invalid field with aria-invalid and an error message
 *  that stays on screen (linked with aria-describedby), clears fields
 *  that are now fine, and moves focus to the first problem. Returns
 *  whether the form is valid. */
export function showErrors(form: HTMLFormElement): boolean {
  let first: HTMLElement | undefined;
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach(
    (field) => {
      if (!field.name || field.type === 'hidden' || field.closest('.form__honeypot')) return;
      const id = `${field.form?.id || 'form'}-${field.name}-error`;
      document.getElementById(id)?.remove();
      if (field.checkValidity()) {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        return;
      }
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', id);
      const message = document.createElement('span');
      message.id = id;
      message.className = 'form__field-error';
      message.textContent = fieldError(field);
      // A radio group's message goes once, under the whole group.
      (field.closest('.form__field, .form__group') ?? field.parentElement)?.append(message);
      first ??= field;
    },
  );
  first?.focus();
  return !first;
}

export default function EnquiryForm({
  kind,
  submitLabel,
  defaultAddress,
  before,
  defaultTopic = '',
  listing,
  choices,
  detailsHeading,
}: EnquiryFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  // A reason from the server worth showing as-is, e.g. a podcast room
  // session someone else booked a moment ago (409).
  const [conflict, setConflict] = useState('');
  // Errors only show after a send attempt; from then on, each field is
  // re-checked as it's corrected.
  const [tried, setTried] = useState(false);
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
    setTried(true);
    if (!showErrors(form)) return;

    setStatus('submitting');
    setConflict('');
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body: new FormData(form) });
      const body = await res.json().catch(() => null);
      if (res.status === 409 && typeof body?.error === 'string') setConflict(body.error);
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
    <form
      className="form"
      id={`enquiry-${kind}`}
      onSubmit={handleSubmit}
      onChange={tried ? (e) => showErrors(e.currentTarget) : undefined}
      noValidate
    >
      {before}

      <p className="form__required">Fields marked * are required.</p>

      {choices}
      {detailsHeading && <h3 className="form__heading">{detailsHeading}</h3>}

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
      {listing && (
        <>
          <input type="hidden" name="address" value={listing.address} />
          <input type="hidden" name="listing" value={listing.id} />
        </>
      )}

      <label className="form__field">
        <span>Name*</span>
        <input type="text" name="name" required autoComplete="name" data-label="Your name" />
      </label>

      <div className="form__split">
        <label className="form__field">
          <span>Email*</span>
          <input type="email" name="email" required autoComplete="email" data-label="Your email" />
        </label>
        <label className="form__field">
          <span>Phone*</span>
          {/* 8 to 20 characters of digits, spaces, brackets, + and dashes;
              functions/api/enquiry.ts also counts the digits. Browsers
              compile `pattern` in strict "v" mode, where ( ) and - inside
              [...] must be escaped, or the whole pattern is ignored. */}
          <input
            type="tel"
            name="phone"
            required
            autoComplete="tel"
            inputMode="tel"
            pattern="\+?[0-9 \(\)\-]{8,20}"
            title="Enter a number we can call, e.g. 0412 345 678 or 08 8123 4567"
            data-label="Your phone number"
          />
        </label>
      </div>

      {needsAddress && (
        <label className="form__field">
          <span>{kind === 'maintenance' ? 'Rental property address*' : 'Property address*'}</span>
          <AddressInput
            name="address"
            required
            autoComplete="street-address"
            defaultValue={defaultAddress}
            data-label="The property address"
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
              <select name="topic" defaultValue={defaultTopic}>
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
              ? 'Your experience and the role you’re after (optional)'
              : 'Anything else we should know? (optional)'}
        </span>
        <textarea name="message" rows={4} required={kind === 'maintenance'} data-label="A description of the repair" />
      </label>

      {TURNSTILE_SITE_KEY && <div ref={turnstileBox} className="form__turnstile" />}

      {status === 'error' && conflict && (
        <p className="form__error" role="alert">
          {conflict}
        </p>
      )}
      {status === 'error' && !conflict && (
        <p className="form__error" role="alert">
          We couldn’t send your enquiry. Your details are still here, so try again, or call{' '}
          <a href={PHONE_TEL}>{PHONE_DISPLAY}</a> ({OPENING_HOURS.display}).
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : submitLabel}
      </button>
      <p className="form__fineprint">
        We use your details to respond to this enquiry. See our <a href="/privacy/">Privacy Policy</a>.
      </p>
    </form>
  );
}
