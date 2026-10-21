// Thin wrapper around the GTM dataLayer and Meta Pixel globals loaded by
// src/partials/head-shared.html. Safe to call when either isn't
// configured: each branch just no-ops.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    /** Loads GTM now if it's still waiting for the page to go idle
     *  (src/partials/head-shared.html). */
    __apnLoadGtm?: () => void;
  }
}

/** The site loads GTM, not gtag.js, so there's no `gtag` until we make
 *  one. This is Google's standard stub: it queues the command on the
 *  dataLayer, where the Google tag that GTM loads picks it up. */
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      // Must be the `arguments` object, not an array, or the Google tag
      // ignores it.
      window.dataLayer!.push(arguments);
    };
  window.gtag(...args);
}

/** Fire after a successful form submission, then call `onDone` (normally
 *  the redirect to /thank-you/). Pushing the event and navigating in the
 *  same tick can abort GTM's in-flight request, so this waits for GTM's
 *  `eventCallback`, with its own ~1.5s fallback in case GTM never calls
 *  back (blocked, slow, or no matching trigger). `onDone` runs exactly
 *  once either way.
 *
 *  The GTM event is `generate_lead`, the same event the landlord page
 *  (src/funnels/landlords/lib/analytics.ts) sends, so one GTM trigger and GA4 tag
 *  cover every form on the site. `event_category` tells the two apart
 *  ('enquiry_form' here, 'appraisal_form' there) and `form_name` is the
 *  enquiry type, e.g. 'sales-appraisal'. See docs/gtm-events.md.
 *
 *  On the /appraisal/ pages it also sends the Google Ads conversion event
 *  `conversion_event_submit_lead_form`, and the redirect waits for that
 *  too (same fallback). */
export function trackFormSubmit(formName: string, onDone: () => void) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };

  // Each event sent below holds the redirect until it calls back.
  let pending = 0;
  const hold = () => {
    pending++;
    let called = false;
    return () => {
      if (called) return;
      called = true;
      if (--pending === 0) finish();
    };
  };
  const gtmDone = hold();
  // GTM waits for the page to go idle; a form sent before then mustn't
  // wait on it, or the lead would sit unsent on the dataLayer.
  window.__apnLoadGtm?.();
  const adsDone = window.location.pathname.startsWith('/appraisal') ? hold() : undefined;

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
      event: 'generate_lead',
      event_category: 'enquiry_form',
      form_name: formName,
      eventCallback: gtmDone,
      eventTimeout: 1500,
    });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
    gtmDone();
  }

  if (adsDone) {
    try {
      gtag('event', 'conversion_event_submit_lead_form', {
        event_callback: adsDone,
        event_timeout: 1500,
      });
    } catch (err) {
      console.warn('Google Ads conversion event failed:', err);
      adsDone();
    }
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

/** A tap on a "WhatsApp" link. `placement` says which one. */
export function trackWhatsAppClick(placement: string) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'click_to_whatsapp', placement });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
  }

  try {
    window.fbq?.('track', 'Contact', { content_name: `whatsapp_${placement}` });
  } catch (err) {
    console.warn('Meta Pixel WhatsApp event failed:', err);
  }
}

/** The chat assistant (src/components/ChatWidget.tsx) was opened.
 *  `source` is how: 'launcher' (the button) or 'teaser' (the greeting
 *  that pops up beside it). */
export function trackChatOpen(source: 'launcher' | 'teaser') {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'chat_open', source });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
  }
}

/** The chat assistant passed a visitor's details to the sheet. The same
 *  `generate_lead` event as the forms, told apart by `event_category`
 *  ('chat_assistant'); `form_name` is the enquiry type, e.g.
 *  'rental-appraisal'. No redirect follows, so nothing waits on it. */
export function trackChatLead(formName: string) {
  // GTM waits for the page to go idle; load it now so the lead is sent.
  window.__apnLoadGtm?.();
  try {
    window.fbq?.('track', formName.endsWith('appraisal') ? 'Lead' : 'Contact', { content_name: `chat_${formName}` });
  } catch (err) {
    console.warn('Meta Pixel event failed:', err);
  }
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'generate_lead', event_category: 'chat_assistant', form_name: formName });
  } catch (err) {
    console.warn('dataLayer push failed:', err);
  }
}
