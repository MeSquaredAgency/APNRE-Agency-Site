// Thin wrapper around the GTM dataLayer and the Meta Pixel global, both
// loaded by src/partials/head-shared.html. GA4 is a tag inside the GTM
// container rather than a gtag.js install, so GA4 events are pushed to
// dataLayer and GTM forwards them — docs/gtm-events.md lists the trigger
// and tag each event needs. Safe to call even when analytics isn't
// configured (VITE_GTM_ID / VITE_META_PIXEL_ID blank): the push lands in
// an array nothing reads, and the fbq branch no-ops.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function pushEvent(event: string, params: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

/** Fire once, right after a successful appraisal-form submission.
 *  `office` is set when the form was on an office page; `managed` is the
 *  answer to "is it currently managed?" and `propertyType` to
 *  "residential or commercial?" (each empty if skipped). */
export function trackAppraisalLead(office?: string, managed?: string, propertyType?: string) {
  try {
    pushEvent('generate_lead', {
      event_category: 'appraisal_form',
      event_label: 'Free Rental Appraisal',
      office: office ?? 'home',
      currently_managed: managed || 'not_answered',
      property_type: propertyType || 'not_answered',
    });
  } catch (err) {
    console.warn('dataLayer lead event failed:', err);
  }

  try {
    window.fbq?.('track', 'Lead', {
      content_name: 'Free Rental Appraisal',
    });
  } catch (err) {
    console.warn('Meta Pixel lead event failed:', err);
  }
}

/** Fire right after a successful appraisal-form submission, then call
 *  `onDone` — normally the redirect to /thank-you/. Waits (briefly) for
 *  GTM's tags to actually finish sending before navigating away: pushing
 *  the event and immediately navigating in the same tick can abort the
 *  in-flight request, so GTM never gets to record the conversion. Uses
 *  `eventCallback` (GTM calls it once every tag triggered by this event
 *  has fired) with a matching `eventTimeout`, plus a `setTimeout`
 *  fallback of its own in case GTM never calls back at all (blocked,
 *  slow to load, or the container has no matching trigger) — either way
 *  `onDone` runs exactly once, at most ~1.5s after the push. */
export function trackAppraisalFormSubmit(formName: string, onDone: () => void) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'appraisal_form_submit',
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

// Call-button taps use the main site's trackCallClick (src/lib/analytics.ts):
// the same click_to_call event and Meta Pixel Contact.
