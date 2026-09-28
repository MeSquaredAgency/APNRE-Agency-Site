// Thin wrapper around the GTM dataLayer and Meta Pixel globals loaded by
// src/partials/head-shared.html. Safe to call when either isn't
// configured: each branch just no-ops.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire after a successful form submission, then call `onDone` (normally
 *  the redirect to /thank-you/). Pushing the event and navigating in the
 *  same tick can abort GTM's in-flight request, so this waits for GTM's
 *  `eventCallback`, with its own ~1.5s fallback in case GTM never calls
 *  back (blocked, slow, or no matching trigger). `onDone` runs exactly
 *  once either way.
 *
 *  The GTM event is `enquiry_form_submit` with `form_name` set to the
 *  enquiry type (e.g. 'sales-appraisal'), so one GTM trigger covers every
 *  form and the GA4 tag can split them by form_name. */
export function trackFormSubmit(formName: string, onDone: () => void) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };

  // Appraisals are the leads worth optimising ads for; everything else
  // is a plain Contact.
  try {
    window.fbq?.('track', formName.endsWith('appraisal') ? 'Lead' : 'Contact', { content_name: formName });
  } catch (err) {
    console.warn('Meta Pixel event failed:', err);
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'enquiry_form_submit',
      form_name: formName,
      eventCallback: finish,
      eventTimeout: 1500,
    });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
    finish();
    return;
  }

  setTimeout(finish, 1500);
}

/** A tap on a "Call" button. `placement` says which one. */
export function trackCallClick(placement: string) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'click_to_call', placement });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
  }

  try {
    window.fbq?.('track', 'Contact', { content_name: placement });
  } catch (err) {
    console.warn('Meta Pixel call event failed:', err);
  }
}
