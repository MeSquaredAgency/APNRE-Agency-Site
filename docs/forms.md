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
