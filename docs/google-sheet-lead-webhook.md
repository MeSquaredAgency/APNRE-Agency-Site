# Wiring the appraisal form to a Google Sheet

This is the "get it working today" backend for the appraisal form. Leads land
as rows in a Google Sheet you own. `functions/api/lead.ts` in this repo posts
to the webhook URL you create here.

Later, if APN gets a confirmed way to push leads straight into PropertyMe
(PropertyMe doesn't currently expose a public self-serve API or a Zapier app
for lead intake — worth asking your PropertyMe account manager directly
whether a partner/API integration exists), you can either:
- add a second `fetch()` call inside `functions/api/lead.ts` alongside the
  sheet write, or
- point a Zapier/Make "New row in Google Sheet" trigger at PropertyMe (or
  at Zapier's PropertyMe action, if one gets added) so the sheet stays the
  single intake point and the sheet → PropertyMe hop is just a zap.

## 1. Create the sheet

1. Create a new Google Sheet, e.g. "APN Website Leads".
2. In row 1, add headers exactly in this order:
   `Timestamp | Name | Email | Phone | Address | Message | Source`

## 2. Add the Apps Script webhook

1. In the sheet: **Extensions → Apps Script**.
2. Replace the default code with:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.address || '',
    data.message || '',
    data.source || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

   (If your tab isn't named `Sheet1`, update the name in `getSheetByName`.)

3. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (this is fine — the URL is a long random
     secret, it's never shown to site visitors, and the Cloudflare Function
     is the only thing that calls it)
4. Authorize the script when prompted (it's your own script, on your own
   sheet).
5. Copy the resulting URL — it ends in `/exec`.

## 3. Add the URL to Cloudflare Pages

1. Cloudflare dashboard → your Pages project → **Settings → Environment
   variables**.
2. Add a **Production** (and Preview, if you want previews to also write
   leads — usually you don't, so consider pointing preview at a second
   test sheet or leaving it unset) variable:
   - Name: `SHEETS_WEBHOOK_URL`
   - Value: the `/exec` URL from step 2.5
3. Redeploy (env var changes need a new deployment to take effect).

## 4. Test it

Submit the live form once with a test name like "TEST — ignore", confirm a
row appears in the sheet, then delete that test row.

## Notes

- Apps Script web apps have generous but not unlimited quotas for free
  Google accounts (a few thousand requests/day) — more than enough for a
  lead form, but worth knowing if traffic spikes heavily.
- Consider turning on email notifications on the sheet (**Tools → Notification
  rules**) so a new lead also pings your inbox, not just the sheet.
