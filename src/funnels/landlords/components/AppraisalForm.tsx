import { useEffect, useRef, useState, type FormEvent } from 'react';
import { trackAppraisalLead, trackAppraisalFormSubmit } from '../lib/analytics';
import { loadTurnstile, TURNSTILE_SITE_KEY } from '../../../lib/turnstile';
import AddressInput from '../../../components/AddressInput';
import { showErrors } from '../../../components/EnquiryForm';
import { OPENING_HOURS, PHONE_DISPLAY, PHONE_TEL } from '../../../data/business';

// Looks like the main site's forms (src/components/EnquiryForm.tsx) and
// checks fields the same way, but posts to its own endpoint,
// functions/api/lead.ts, and sends the landlord page's own analytics
// events (lib/analytics.ts), so ad conversions are counted exactly as
// before. Field names must match functions/api/lead.ts.
const FORM_ENDPOINT = '/api/lead';

type Status = 'idle' | 'submitting' | 'error';

// Values must match MANAGED_LABELS in functions/api/lead.ts.
const MANAGED_OPTIONS = [
  { value: 'agent', label: 'Yes, by another agent' },
  { value: 'self', label: 'No, I manage it myself' },
  { value: 'not-rented', label: 'No, it isn’t rented yet' },
] as const;

// Values must match PROPERTY_TYPE_LABELS in functions/api/lead.ts.
const PROPERTY_TYPE_OPTIONS = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
] as const;
export type PropertyType = (typeof PROPERTY_TYPE_OPTIONS)[number]['value'];

/** Dispatched by the "switching" buttons so the form arrives with "Yes,
 *  by another agent" already picked. */
export const SWITCHING_EVENT = 'apn:switching';

/** Dispatched by the hero's Residential / Commercial Appraisal buttons,
 *  with the type as `detail`, so the form arrives with it picked. */
export const PROPERTY_TYPE_EVENT = 'apn:property-type';

export function pickPropertyType(type: PropertyType) {
  window.dispatchEvent(new CustomEvent<PropertyType>(PROPERTY_TYPE_EVENT, { detail: type }));
}

export default function AppraisalForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [managed, setManaged] = useState('');
  const [propertyType, setPropertyType] = useState('');
  // Errors only show after a send attempt; from then on, each field is
  // re-checked as it's corrected.
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const onSwitching = () => setManaged('agent');
    const onPropertyType = (e: Event) => setPropertyType((e as CustomEvent<PropertyType>).detail);
    window.addEventListener(SWITCHING_EVENT, onSwitching);
    window.addEventListener(PROPERTY_TYPE_EVENT, onPropertyType);
    return () => {
      window.removeEventListener(SWITCHING_EVENT, onSwitching);
      window.removeEventListener(PROPERTY_TYPE_EVENT, onPropertyType);
    };
  }, []);

  // Turnstile spam check, when a site key is configured: the same widget
  // as the main site's forms, checked by functions/api/lead.ts when
  // TURNSTILE_SECRET is set.
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
          action: 'landlord-appraisal', // checked by functions/api/lead.ts
          appearance: 'interaction-only',
        });
      })
      .catch((err) => console.warn(err));
    return () => {
      cancelled = true;
      if (turnstileId.current) window.turnstile?.remove(turnstileId.current);
      turnstileId.current = undefined;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setTried(true);
    if (!showErrors(form)) return;

    setStatus('submitting');
    try {
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || body.ok !== true) {
        throw new Error(`Submission not confirmed (${res.status}): ${JSON.stringify(body)}`);
      }

      trackAppraisalLead(undefined, managed, propertyType);
      // The redirect happens inside this callback, once GTM's tags for
      // this event have fired (or ~1.5s elapses, whichever's first); see
      // trackAppraisalFormSubmit.
      trackAppraisalFormSubmit('landlord_appraisal', () => {
        window.location.href = '/landlords/thank-you/';
      });
    } catch (err) {
      console.error('Appraisal form submission failed:', err);
      // Turnstile tokens are single-use, so get a fresh one for the retry.
      if (turnstileId.current) window.turnstile?.reset(turnstileId.current);
      setStatus('error');
    }
  }

  return (
    <form
      className="form"
      id="landlord-appraisal"
      onSubmit={handleSubmit}
      onChange={tried ? (e) => showErrors(e.currentTarget) : undefined}
      noValidate
    >
      <p className="form__required">Fields marked * are required.</p>

      {/* Honeypot. Deliberately not named like a real field: browser
          autofill ignores CSS hiding and would fill a field called
          "company" or "website", silently dropping real leads. */}
      <div className="form__honeypot" aria-hidden="true">
        <label>
          Leave this field blank
          <input type="text" name="hp_confirm" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

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
          {/* Same rule as functions/api/lead.ts; see EnquiryForm.tsx for
              why ( ) and - are escaped. */}
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

      <label className="form__field">
        <span>Property address*</span>
        <AddressInput name="address" required autoComplete="street-address" data-label="The property address" />
      </label>

      <fieldset className="form__choice">
        <legend>Residential or commercial?</legend>
        <div className="form__choice-options">
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="propertyType"
                value={option.value}
                checked={propertyType === option.value}
                onChange={() => setPropertyType(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="form__choice">
        <legend>Is the property currently managed?</legend>
        <div className="form__choice-options">
          {MANAGED_OPTIONS.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="managed"
                value={option.value}
                checked={managed === option.value}
                onChange={() => setManaged(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {managed === 'agent' && (
          <p className="form__note">We’ll explain how changing over works, including while the property is tenanted.</p>
        )}
      </fieldset>

      <label className="form__field">
        <span>Anything else that helps? (optional)</span>
        <textarea name="message" rows={4} placeholder="Property type, bedrooms, current rent — whatever’s useful." />
      </label>

      {TURNSTILE_SITE_KEY && <div ref={turnstileBox} className="form__turnstile" />}

      {status === 'error' && (
        <p className="form__error" role="alert">
          We couldn’t send your details. They’re still here, so try again, or call{' '}
          <a href={PHONE_TEL}>{PHONE_DISPLAY}</a> ({OPENING_HOURS.display}).
        </p>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'submitting'}>
        {status === 'submitting'
          ? 'Sending…'
          : propertyType === 'commercial'
            ? 'Get My Free Commercial Appraisal'
            : 'Get My Free Rental Appraisal'}
      </button>
      <p className="form__fineprint">
        We use your details to prepare your appraisal and contact you about it. See our{' '}
        <a href="/privacy/">Privacy Policy</a>.
      </p>
    </form>
  );
}
