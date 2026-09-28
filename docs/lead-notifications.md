# Emailing the right person when a lead comes in

Every form on this site (and on the landlord landing page) ends up as a
row in the same Google Sheet, through the sheet's Apps Script webhook.
Nothing tells anyone a row has arrived. The script below replaces the
existing one: it writes the row **exactly as before**, then emails the
team that should handle it.

- If the email fails (quota, typo in an address), the row is still saved
  and the form still succeeds. The failure is logged in Apps Script's
  Executions view.
- Each email's Reply-To is the person who filled in the form, so hitting
  Reply answers them directly.
- The script runs as the sheet owner's Google account, so emails come from
  that address. A free Gmail account can send about 100 a day; Google
  Workspace, about 1,500.

## 1. Fill in the addresses

Edit `ROUTES` at the top of the script. Each rule matches text in the
sheet's Source column (the first matching rule wins); `DEFAULT_TO`
catches anything else. Several addresses can go in one string, separated
by commas.

| Source contains | Comes from | Suggested inbox |
| --- | --- | --- |
| `Sales appraisal`, `Buyer register` | agency site | Sales |
| `Rental appraisal`, `Tenant register`, `Maintenance request` | agency site | Property management |
| `appraisal form` | landlord landing page | Property management |
| `Careers` | agency site | Whoever handles hiring |
| anything else (e.g. `General enquiry`) | agency site | Front office |

## 2. Replace the script

In the sheet: **Extensions → Apps Script**, replace everything with the
code below, save, then **Deploy → Manage deployments → edit (pencil) →
Version: New version → Deploy**. Editing the code alone doesn't change
the live webhook, and redeploying this way keeps the same `/exec` URL, so
nothing in Cloudflare needs changing.

The first time, Google asks you to authorise sending email as you.

```javascript
// ---- Who gets emailed. Edit these. ----
const ROUTES = [
  { match: 'Sales appraisal', to: 'SALES@EXAMPLE.COM' },
  { match: 'Buyer register', to: 'SALES@EXAMPLE.COM' },
  { match: 'Rental appraisal', to: 'PM@EXAMPLE.COM' },
  { match: 'Tenant register', to: 'PM@EXAMPLE.COM' },
  { match: 'Maintenance request', to: 'PM@EXAMPLE.COM' },
  { match: 'appraisal form', to: 'PM@EXAMPLE.COM' }, // landlord landing page
  { match: 'Careers', to: 'OFFICE@EXAMPLE.COM' },
];
const DEFAULT_TO = 'OFFICE@EXAMPLE.COM';
const SHEET_NAME = 'Sheet1';
// ----------------------------------------

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);

  // Unchanged from the original script: same columns, same order.
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.address || '',
    data.message || '',
    data.source || '',
  ]);

  // The row is saved; an email problem mustn't fail the form.
  try {
    notify(data, sheet.getParent().getUrl());
  } catch (err) {
    console.error('Lead notification failed: ' + err);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function notify(data, sheetUrl) {
  const source = String(data.source || '');
  const route = ROUTES.find((r) => source.indexOf(r.match) !== -1);
  const to = route ? route.to : DEFAULT_TO;
  if (!to || to.indexOf('EXAMPLE.COM') !== -1) return; // not set up yet

  const kind = source.split(' / ').pop() || 'Website enquiry';
  const lines = [
    'Name: ' + (data.name || ''),
    'Phone: ' + (data.phone || ''),
    'Email: ' + (data.email || ''),
    data.address ? 'Address: ' + data.address : '',
    '',
    data.message || '(no message)',
    '',
    'Source: ' + source,
    'All enquiries: ' + sheetUrl,
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '');

  const options = { name: 'APN Website' };
  // Only use the enquirer's address as Reply-To if it looks like one.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) options.replyTo = data.email;

  MailApp.sendEmail(to, 'New ' + kind + ': ' + (data.name || 'website enquiry'), lines.join('\n'), options);
}
```

## 3. Test it

Submit one form of each kind on a preview deployment pointed at the real
sheet (or on the live site), with a name like "TEST — ignore". Check that
each email lands in the right inbox, then delete the test rows.

Leaving an address as `…@EXAMPLE.COM` skips the email for that rule, so
the script is safe to deploy before every inbox is decided.
