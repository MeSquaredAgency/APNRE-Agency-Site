# Forms → Google Sheet

Every form on the site posts to `/api/enquiry`
(`functions/api/enquiry.ts`, a Cloudflare Pages Function). The function
validates the form and forwards it to a Google Apps Script webhook,
which appends a row to a sheet.

It sends exactly the payload the landlord landing page's `/api/lead`
sends (`name, email, phone, address, message, source, submittedAt`), so
you can use the **same sheet and the same Apps Script**. The setup steps
are in the landing page repo: `APNRE-Website/docs/google-sheet-lead-webhook.md`.
Then set `SHEETS_WEBHOOK_URL` in this site's Cloudflare Pages project
too.

## What ends up in each column

| Column | Contents |
| --- | --- |
| Name / Email / Phone | Always required |
| Address | Required for appraisals and repair requests; blank otherwise |
| Message | Form-specific answers in brackets, then the free-text message, e.g. `[Suburbs: Enfield \| Budget: 700k \| Bedrooms: 3+] Looking for a yard` |
| Source | `apnre agency site / <form>`, one of: Sales appraisal, Rental appraisal, Buyer register, Tenant register, General enquiry, Careers expression of interest, Maintenance request |

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
   hostnames `apnre.com.au`, `www.apnre.com.au` and your
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

The landlord landing page's form (`/api/lead` in that repo) isn't
covered; it still relies on its honeypot.
