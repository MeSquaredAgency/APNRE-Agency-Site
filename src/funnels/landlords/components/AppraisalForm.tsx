import { useEffect, useRef, useState, type FormEvent } from 'react';
import { trackAppraisalLead, trackAppraisalFormSubmit } from '../lib/analytics';
import { loadTurnstile, TURNSTILE_SITE_KEY } from '../../../lib/turnstile';
import type { OfficeId } from '../data/offices';

// Posts to the Cloudflare Pages Function at functions/api/lead.ts, which
// forwards the submission server-side to a Google Sheet (see
// docs/google-sheet-lead-webhook.md for setup). Same-origin, so no CORS
// configuration needed. Swap this if the intake mechanism ever changes.
const FORM_ENDPOINT = '/api/lead';

type Status = 'idle' | 'submitting' | 'error' | 'not-connected';

// Values must match MANAGED_LABELS in functions/api/lead.ts.
const MANAGED_OPTIONS = [
  { value: 'agent', label: 'Yes, by another agent' },
  { value: 'self', label: 'No, I manage it myself' },
  { value: 'not-rented', label: 'No, it isn’t rented yet' },
] as const;

/** Dispatched by the "switching" CTAs so the form arrives with "Yes, by
 *  another agent" already picked. */
export const SWITCHING_EVENT = 'apn:switching';

interface AppraisalFormProps {
  /** Set on an office page so the lead is tagged with that office in the
   *  sheet's Source column (see functions/api/lead.ts). */
  office?: OfficeId;
}

export default function AppraisalForm({ office }: AppraisalFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [managed, setManaged] = useState('');

  useEffect(() => {
    const onSwitching = () => setManaged('agent');
    window.addEventListener(SWITCHING_EVENT, onSwitching);
    return () => window.removeEventListener(SWITCHING_EVENT, onSwitching);
  }, []);

  // Turnstile spam check, when a site key is configured: the same widget
  // as the main site's forms (src/components/EnquiryForm.tsx), checked by
  // functions/api/lead.ts when TURNSTILE_SECRET is set.
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
    if (!e.currentTarget.reportValidity()) return;

    if (!FORM_ENDPOINT) {
      // No backend configured. Do not fake a successful lead capture —
      // tell the truth in the UI instead.
      setStatus('not-connected');
      return;
    }

    setStatus('submitting');
    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const body = await res.json().catch(() => null);
      if (!body || body.ok !== true) throw new Error(`Submission not confirmed: ${JSON.stringify(body)}`);

      trackAppraisalLead(office, managed);
      // The redirect happens inside this callback, once GTM's tags for
      // this event have fired (or ~1.5s elapses, whichever's first) — see
      // trackAppraisalFormSubmit. No setStatus('sent') needed either way:
      // the component is about to unmount.
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

  const showForm = status === 'idle' || status === 'submitting' || status === 'error';

  return (
    <section id="appraisal" className="section section-paper appraisal">
      <div className="wrap appraisal__grid">
        <div className="appraisal__copy">
          <span className="eyebrow">Free rental appraisal</span>
          <h2 className="h-1">What is your property really worth to rent?</h2>
          <p className="lede">
            Tell us about your property. A local APN property manager will
            review the details and contact you directly.
          </p>

          <div className="appraisal__steps">
            <span className="appraisal__steps-label">What happens next</span>
            <ol className="appraisal__steps-list">
              <li>
                <span className="appraisal__step-num">01</span>
                <div>
                  <h3 className="appraisal__step-title">We review your property</h3>
                  <p>We review the information you’ve provided and assess the property.</p>
                </div>
              </li>
              <li>
                <span className="appraisal__step-num">02</span>
                <div>
                  <h3 className="appraisal__step-title">We contact you</h3>
                  <p>An APN property manager gets in touch directly.</p>
                </div>
              </li>
              <li>
                <span className="appraisal__step-num">03</span>
                <div>
                  <h3 className="appraisal__step-title">You decide</h3>
                  <p>There’s no obligation to appoint APN.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="appraisal__form-wrap">
          {!FORM_ENDPOINT && showForm && (
            <div className="appraisal__dev-notice" role="note">
              <strong>Development notice:</strong> this form isn’t connected
              to a live backend yet. Submissions will not be sent or
              received until an integration is added — see the
              <code> FORM_ENDPOINT</code> constant in
              <code> AppraisalForm.tsx</code>.
            </div>
          )}

          {status === 'not-connected' && (
            <div className="appraisal__result appraisal__result--warning" role="status">
              <h3 className="h-3">This form isn’t connected yet.</h3>
              <p className="body-copy">
                Your details were <strong>not</strong> sent anywhere — this
                build has no backend wired up, so nothing was received on
                APN’s end. Once a real submission endpoint is connected,
                this message will be replaced with an actual confirmation.
              </p>
              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={() => setStatus('idle')}
              >
                Back to the form
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="appraisal__dev-notice appraisal__dev-notice--error" role="alert">
              Something went wrong sending this form. Please try again, or
              call the office directly.
            </div>
          )}

          {showForm && (
            <form className="appraisal__form" onSubmit={handleSubmit} noValidate>
              {/* Honeypot — hidden from real visitors via CSS, invisible to
                  screen readers. Bots that fill every field trip this and
                  functions/api/lead.ts silently drops the submission.
                  Deliberately NOT named/labelled like a real field (e.g.
                  "company", "website") — browser autofill ignores CSS
                  visual-hiding and will happily fill a hidden field if its
                  name/label matches a saved profile value, which silently
                  drops real submissions exactly like a bot would. */}
              <div className="appraisal__honeypot" aria-hidden="true">
                <label>
                  Leave this field blank
                  <input type="text" name="hp_confirm" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              {office && <input type="hidden" name="office" value={office} />}

              <div className="appraisal__row">
                <label>
                  Name*
                  <input type="text" name="name" required autoComplete="name" />
                </label>
              </div>

              <div className="appraisal__row appraisal__row--split">
                <label>
                  Email*
                  <input type="email" name="email" required autoComplete="email" />
                </label>
                <label>
                  Phone*
                  {/* Same rule as functions/api/lead.ts; see EnquiryForm.tsx
                      for why ( ) and - are escaped. */}
                  <input
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    pattern="\+?[0-9 \(\)\-]{8,20}"
                    title="A phone number with at least 8 digits, e.g. 0412 345 678"
                  />
                </label>
              </div>

              <div className="appraisal__row">
                <label>
                  Property address*
                  <input type="text" name="address" required autoComplete="street-address" />
                </label>
              </div>

              <fieldset className="appraisal__choice">
                <legend>Is the property currently managed?</legend>
                <div className="appraisal__choice-options">
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
                  <p className="appraisal__choice-note">
                    We’ll explain how changing over works, including while
                    the property is tenanted.
                  </p>
                )}
              </fieldset>

              <div className="appraisal__row">
                <label>
                  Anything else that helps? (optional)
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Property type, bedrooms, current rent — whatever's useful."
                  />
                </label>
              </div>

              {TURNSTILE_SITE_KEY && <div ref={turnstileBox} className="appraisal__turnstile" />}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : 'Get My Free Rental Appraisal'}
              </button>
              <p className="appraisal__fineprint">
                * Required. We use your details to prepare your appraisal and
                contact you about it. See our{' '}
                <a href="/privacy/">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
