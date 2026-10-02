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
| Source | `apnre agency site / <form>`, one of: Sales appraisal, Rental appraisal, Buyer register, Tenant register, General enquiry, Careers expression of interest, Maintenance request, Listing enquiry, Office space lease, Podcast room hire |

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
   hostnames `apnre.com.au`, `www.apnre.com.au`, `go.apnre.com.au` and your
   `<project>.pages.dev` preview domain. Widget mode: **Managed**.
2. In the Pages project → **Settings → Environment variables**, add both
   (Production, and Preview if you want previews checked too):
   - `VITE_TURNSTILE_SITE_KEY` = the site key (public; used at build time)
   - `TURNSTILE_SECRET` = the secret key (keep it secret; used by
     `functions/api/enquiry.ts`)
3. Redeploy.

Set **both or neither**. With only the secret set, the forms can't
produce a token and every enquiry is rejected. With only the site key
set, the widget shows but nothing checks it.

The landlord funnel's form (`functions/api/lead.ts`) uses the same keys
and is checked the same way. The server also confirms each token was
issued on an APN hostname (or a `pages.dev` preview) and for that form.

Turnstile stops automated posts but not a determined human, so also add
a rate-limiting rule: Cloudflare dashboard → the apnre.com.au zone →
**Security → WAF → Rate limiting rules**, matching URI path starting
with `/api/`, e.g. 5 requests per minute per IP, action Block.
