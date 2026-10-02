# Emailing the right person when a lead comes in

Every form on this site (and on the landlord landing page) ends up as a
row in the same Google Sheet, through the sheet's Apps Script webhook.
Nothing tells anyone a row has arrived. The script below replaces the
existing one: it writes the row **exactly as before**, then emails the
team that should handle it.

It also runs the podcast room's calendar for `/office-space/`
(docs/office-space.md): each podcast room request is held in a Google
Calendar called "APN Podcast Room" (made the first time it's needed), and
the website reads that calendar back to grey out sessions that are taken.

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

| Source contains | Comes from | Inbox (live, 2 Oct 2026) |
| --- | --- | --- |
| `Sales appraisal`, `Buyer register` | agency site | sales@apnre.com.au |
| `Rental appraisal`, `Tenant register` | agency site | sales@apnre.com.au |
| `Maintenance request` | agency site | patrick@apnre.com.au |
| `appraisal form` | landlord landing page | sales@apnre.com.au |
| `Careers` | agency site | patrick@apnre.com.au |
| `Office space lease`, `Podcast room hire` | agency site (`/office-space/`) | sales@apnre.com.au |
| anything else (e.g. `General enquiry`) | agency site | sales@apnre.com.au |

The live script is the **Website Leads** Apps Script project, bound to
the leads sheet, in the `Notification.gs` file. (Its `Code.gs` still has
the original one-function script; the `doPost` in `Notification.gs`
overrides it.) Keep this page and that file the same, so pasting this
script never undoes a change made there.

## 2. Replace the script

In the sheet: **Extensions → Apps Script**, replace everything with the
code below, save, then **Deploy → Manage deployments → edit (pencil) →
Version: New version → Deploy**. Editing the code alone doesn't change
the live webhook, and redeploying this way keeps the same `/exec` URL, so
nothing in Cloudflare needs changing.

Also in Apps Script, **Project Settings → Time zone → (GMT+09:30)
Adelaide**, so all-day events in the podcast room calendar land on the
right day.

The first time, Google asks you to authorise sending email and managing
your calendars as you. The calendar belongs to whichever account owns the
script; to let colleagues see and edit it, open Google Calendar → **APN
Podcast Room → Settings and sharing → Share with specific people** and
add them with "Make changes to events". It appears after the first
podcast room request, or straight away if you run `podcastCalendar` once
from the editor.

```javascript
// ---- Who gets emailed. Edit these. ----
const ROUTES = [
  { match: 'Sales appraisal', to: 'sales@apnre.com.au' },
  { match: 'Buyer register', to: 'sales@apnre.com.au' },
  { match: 'Rental appraisal', to: 'sales@apnre.com.au' },
  { match: 'Tenant register', to: 'sales@apnre.com.au' },
  { match: 'Maintenance request', to: 'patrick@apnre.com.au' },
  { match: 'appraisal form', to: 'sales@apnre.com.au' }, // landlord landing page
  { match: 'Careers', to: 'patrick@apnre.com.au' },
  { match: 'Office space lease', to: 'sales@apnre.com.au' },
  { match: 'Podcast room hire', to: 'sales@apnre.com.au' },
];
const DEFAULT_TO = 'sales@apnre.com.au';
const SHEET_NAME = 'Sheet1';
// The podcast room's calendar (/office-space/). Made the first time it's
// needed. If you rename it in Google Calendar, rename it here too.
const PODCAST_CALENDAR = 'APN Podcast Room';
const TIME_ZONE = 'Australia/Adelaide';
// How far ahead the website looks: a little past its 10-week window.
const BOOKING_WEEKS = 12;
// ----------------------------------------

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);

  // Same columns, same order as the original script.
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    // Stored as text: without the leading apostrophe, Sheets drops the
    // 0 from 0412 345 678 and reads +61 412 345 678 as a formula.
    data.phone ? "'" + data.phone : '',
    data.address || '',
    data.message || '',
    data.source || '',
  ]);

  // A podcast room request: hold the session so nobody else can ask for
  // it. Like the email, a problem here mustn't fail the form.
  if (data.booking) {
    try {
      holdPodcastSession(data);
    } catch (err) {
      console.error('Podcast room hold failed: ' + err);
    }
  }

  // The row is saved; an email problem mustn't fail the form.
  try {
    notify(data, sheet.getParent().getUrl());
  } catch (err) {
    console.error('Lead notification failed: ' + err);
  }

  return json({ ok: true });
}

// GET ?action=podcast-availability: when the podcast room is taken, for
// the booking calendar on /office-space/. Times only, never who booked.
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action !== 'podcast-availability') return json({ ok: false, error: 'Unknown action' });

  const from = new Date();
  const to = new Date(from.getTime() + BOOKING_WEEKS * 7 * 24 * 60 * 60 * 1000);
  const zone = Session.getScriptTimeZone();
  const events = podcastCalendar().getEvents(from, to).map((event) =>
    event.isAllDayEvent()
      ? {
          allDay: true,
          start: Utilities.formatDate(event.getAllDayStartDate(), zone, 'yyyy-MM-dd'),
          days: Math.max(1, Math.round((event.getEndTime() - event.getStartTime()) / 86400000)),
        }
      : { allDay: false, start: event.getStartTime().toISOString(), end: event.getEndTime().toISOString() },
  );
  return json({ ok: true, events });
}

// Puts a "Requested" event in the podcast room calendar for the session
// the website sent: { date: '2026-10-05', start: '08:30', end: '12:30' }.
// Staff call to confirm (and rename it "Booked: …"), or delete it to free
// the session.
function holdPodcastSession(data) {
  const b = data.booking;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !/^\d{2}:\d{2}$/.test(b.start) || !/^\d{2}:\d{2}$/.test(b.end)) {
    throw new Error('Unexpected booking: ' + JSON.stringify(b));
  }
  const at = (time) => Utilities.parseDate(b.date + ' ' + time, TIME_ZONE, 'yyyy-MM-dd HH:mm');
  podcastCalendar().createEvent('Requested: ' + (data.name || 'website booking'), at(b.start), at(b.end), {
    description: [
      'Requested on the website. Call to confirm, then rename this "Booked: ' + (data.name || '') + '".',
      'Delete this event to free the session.',
      '',
      'Session: ' + (b.session || ''),
      'Name: ' + (data.name || ''),
      'Phone: ' + (data.phone || ''),
      'Email: ' + (data.email || ''),
      '',
      data.message || '',
    ].join('\n'),
  });
}

function podcastCalendar() {
  return (
    CalendarApp.getCalendarsByName(PODCAST_CALENDAR)[0] ||
    CalendarApp.createCalendar(PODCAST_CALENDAR, { timeZone: TIME_ZONE })
  );
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
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

For the podcast room: request a session on `/office-space/`, check a
"Requested" event appears in the APN Podcast Room calendar, reload the
page and check that session is greyed out, then delete the event (the
session frees up within a minute or two).
