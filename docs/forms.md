# Forms → Google Sheet

Every form on the site posts to `/api/enquiry`
(`functions/api/enquiry.ts`, a Cloudflare Pages Function). The function
validates the form and forwards it to a Google Apps Script webhook,
which appends a row to a sheet.

It sends exactly the payload the landlord landing page's `/api/lead`
sends (`name, email, phone, address, message, source, submittedAt`), so
you can use the **same sheet and the same Apps Script**. The setup steps
are in `docs/google-sheet-lead-webhook.md` (it describes the landlord
page's `/api/lead`; this site's `/api/enquiry` uses the same sheet and
script).
Then set `SHEETS_WEBHOOK_URL` in this site's Cloudflare Pages project
too.

## Keeping the sheet safe

Google Sheets reads a cell starting with `=`, `+`, `-` or `@` as a
formula, so a visitor could plant one in a row staff will open. Both
endpoints add a leading apostrophe to any such value
(`sheetSafe` in `functions/_lib/forms.ts`), which Sheets stores as plain
text and doesn't show. Phone numbers are the exception: the Apps Script
in `docs/google-sheet-lead-webhook.md` and `docs/lead-notifications.md`
writes that column as text itself, so `0412 345 678` keeps its 0 and
`+61 412 345 678` isn't read as a sum. **If the sheet's script predates
September 2026, replace it with the current one** (Deploy → Manage
deployments → New version keeps the same URL).

The endpoints also check the email and phone format, cap every field's
length, and give up on the webhook after 10 seconds.

## What ends up in each column

| Column | Contents |
| --- | --- |
| Name / Email / Phone | Always required |
| Address | Required for appraisals and repair requests; blank otherwise |
| Message | Form-specific answers in brackets, then the free-text message, e.g. `[Suburbs: Enfield \| Budget: 700k \| Bedrooms: 3+] Looking for a yard` |
| Source | `apnre agency site / <form>`, one of: Sales appraisal, Rental appraisal, Buyer register, Tenant register, General enquiry, Careers expression of interest, Maintenance request, Listing enquiry, Office space lease, Podcast room hire. Leads from the chat assistant come through as `apnre agency site / Chat assistant / <type>` (`docs/chat-assistant.md`) |

Filter the sheet on Source to split leads by team, or point a Zapier/Make
"new row" trigger at it to route each type to the right inbox.

## Adding or changing a form

The enquiry types are defined in two places that must match:

- `EnquiryKind` and the fields in `src/components/EnquiryForm.tsx`
- `TYPES` in `functions/api/enquiry.ts` (label, required fields, and
  which extra fields are folded into the Message column)

Choice fields that are written to the sheet as-is (`managed`, `office`)
are checked against `CHOICES` in the function, so a tampered form can't
write arbitrary text into them.

## Testing

`npm run dev` has no Pages Functions, so forms show their error state
locally. To test end to end, deploy a preview, point its
`SHEETS_WEBHOOK_URL` at a test sheet, submit each form once with a name
like "TEST — ignore", and check the rows.

## Emailing new leads to the right team

See `docs/lead-notifications.md`: a drop-in replacement for the sheet's
Apps Script that keeps writing rows exactly as before and also emails
each enquiry to the right inbox.

## Spam protection (Cloudflare Turnstile)

Every form has a honeypot field. Turnstile adds Cloudflare's spam check,
which is invisible to most visitors and only asks for a click when it
isn't sure. It's off until both keys are set:

1. Cloudflare dashboard → **Turnstile** → **Add widget**. Add the
   hostnames `apnre.com.au`, `www.apnre.com.au` and the
   `apnre-agency-site.pages.dev` preview domain. Widget mode: **Managed**.
2. In the Pages project → **Settings → Environment variables**, add both
   (Production, and Preview if you want previews checked too):
   - `VITE_TURNSTILE_SITE_KEY` = the site key (public; used at build time)
   - `TURNSTILE_SECRET` = the secret key (keep it secret; used by
     `functions/api/enquiry.ts`)
3. Redeploy.

Set **both or neither**. With only the secret set, the forms can't
produce a token and every enquiry is rejected. With only the site key
set, the widget shows but nothing checks it.

How it behaves on the main site's forms (`src/components/EnquiryForm.tsx`):

- Cloudflare's script only loads once a form is likely to be used: the
  visitor clicks into or types in it, or it scrolls within about 300px
  of the screen, whichever comes first. Pages whose form is never
  reached never load it.
- The widget is `interaction-only`: it takes no space and shows nothing
  unless Cloudflare wants the visitor to click a checkbox, in which case
  it appears just above the send button.
- Pressing send waits for the token (normally ready long before then).
  If Turnstile can't load at all, the form is sent anyway and the server
  turns it down, so the visitor sees the error message with the phone
  number rather than a stuck button.

The landlord funnel's form still loads Turnstile as soon as the page
loads (it's the page's whole point).

The landlord funnel's form (`functions/api/lead.ts`) uses the same keys
and is checked the same way. The server also confirms each token was
issued on an APN hostname, or on this project's own previews
(`apnre-agency-site.pages.dev` and `*.apnre-agency-site.pages.dev`), and
for that form. Until November 2026 any `*.pages.dev` host passed, which
would have accepted a token solved on someone else's Pages site. If the
Pages project is ever renamed, update `PREVIEW_HOST` in
`functions/_lib/forms.ts`, or tokens from previews will be refused.

Turnstile stops automated posts but not a determined human, so also add
a rate-limiting rule: Cloudflare dashboard → the apnre.com.au zone →
**Security → WAF → Rate limiting rules**, matching URI path starting
with `/api/`, e.g. 5 requests per minute per IP, action Block.

## Forwarding to MeSquared OS

Every enquiry is also sent, server-side, to MeSquared OS (Me²'s operations
platform), which acknowledges the visitor within minutes, alerts the right
person at APN and tracks the follow-up. The Google Sheet stays the record;
the forward runs after the sheet post and never changes what the visitor
sees.

Setup: in the Cloudflare Pages project → Settings → Environment variables,
add `MESQUARED_INTAKE_KEY` (Production) with the intake key issued for APN
in MeSquared OS (console → APN Real Estate → Settings → API keys, "intake"
scope). Without it the forward is simply skipped. `MESQUARED_INTAKE_URL`
overrides the platform address for a staging deployment.

What is sent: name, email, phone, the message (prefixed with the form type
and the property address when there is one), and the form's extra answers
as `fields`. Nothing from the honeypot or Turnstile.
