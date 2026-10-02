# Office space and the podcast room (`/office-space/`)

APN leases the spare offices on Level 1 of its Blair Athol building
(420B Main North Road) for 6 to 12 months, and hires out one room, with
recording kit, as a podcast room: $120 for 2 hours, $175 a half day or
$260 a full day, including GST. The page shows a clickable floor
plan, what's included, and a booking form for each.

Facts and prices come from APN's commercialrealestate.com.au listing
(17603774). The original floor plan drawing is served unchanged at
`/office-space/floor-plan.jpg` (`public/office-space/`). Room sizes the
listing's drawing leaves out, the storage room and the street names come
from APN's Floorplanner plan of the floor (457 m² nett lettable).

## How a booking works

Nothing is booked instantly:

- **Offices.** The visitor picks an office (or "Not sure yet"), a term
  (6, 9, 12 or 12+ months), a preferred start date, and optionally how
  many people and their business name. An office with `availableFrom`
  can't be requested to start before that date. Once every office is
  leased, the form becomes a waitlist ("Join the Waitlist") and the
  request comes in as "Next available office (waitlist)". The request
  lands in the Google Sheet with Source `apnre agency site / Office space
  lease`, and the Address column names the office. Someone calls them to
  arrange an inspection; the lease is signed as usual.
- **Podcast room.** The visitor picks a date (Monday to Saturday, from
  tomorrow, up to 10 weeks ahead) and a session: 2 hours (8:30–10:30am,
  10:30am–12:30pm, 1:00–3:00pm or 3:00–5:00pm), a half day (8:30am–12:30pm
  or 1:00–5:00pm) or the full day (8:30am–5:00pm). Any session that
  overlaps one already held or booked is greyed out. The request lands
  with Source `apnre agency site / Podcast room hire`, and the session is
  held straight away in the podcast room calendar (below), so nobody
  else can request it. Someone calls to confirm.

Both go through `/api/enquiry`, so the lead emails, GTM `generate_lead`
event and thank-you page work as for every other form. Both email
sales@apnre.com.au (`docs/lead-notifications.md`).

## Changing rooms, prices and details

Everything is in `src/data/office-space.ts`. Edit it and redeploy:

| To… | Change |
| --- | --- |
| Mark an office leased, or free again | Its `status`: `'available'` or `'occupied'`. It drops out of (or back into) the form and turns grey (or green) on the plan. |
| Show a future vacancy | `availableFrom: '2027-01-15'` on an available office |
| Price one office | `weeklyRent` (including GST). Unset, the page shows "from $220 a week". |
| Change the "from" price, consumables or printing | `OFFICE_RENT_FROM`, `CONSUMABLES_PER_WEEK`, `PRINTING` |
| Change podcast room prices | `PODCAST_LENGTHS` (2 hours, half day, full day; including GST) |
| List the podcast room's kit | `PODCAST_EQUIPMENT`, e.g. `['Two Shure SM7B mics', 'Rodecaster Pro II', 'Acoustic panels']`. Empty, the page just says "Recording kit included" (`PODCAST_KIT_INCLUDED`). |
| Change session times | `PODCAST_SESSIONS` (each with its length, label, times, and the minutes used to check the calendar) |
| Book further ahead | `PODCAST_BOOKING_WEEKS` |

**Offices 1–4 are scaled, not tape-measured.** Neither drawing labels
them, so their sizes (2.6 × 3.9 m for each of Offices 1–3, which APN
confirmed are the same size, and 3.2 × 5.6 m for Office 4) were scaled
off the Floorplanner plan against the rooms it does label. They're good
to about 0.1 m; correct `size` if a tape measure says otherwise.

The office numbers (1–13) are ours; the drawing calls every office
"Office 1". Offices 1–7 were the green "available" rooms on the drawing.
The podcast room was another green room: the one next to reception, so
day hirers don't walk past tenants' offices. To use a different room,
swap `use: 'podcast'` onto it.

The plan is drawn from each room's `plan` shape, in pixels of the
original drawing (about 43 to the metre). If walls move, update the
shapes; the page draws the plan both sideways (wide screens) and upright
(phones) from the same numbers.

## The podcast room calendar

The podcast room's bookings live in a Google Calendar called **APN
Podcast Room**, run by the leads sheet's Apps Script
(`docs/lead-notifications.md`). Nobody has to set it up by hand: the
script makes the calendar the first time it's needed.

- **A request comes in:** the script adds a "Requested: <name>" event
  for that session, with their phone, email and message, and emails
  sales@apnre.com.au. The website greys the session out at once, and
  turns away anyone else who tries to request it.
- **Confirmed:** rename the event "Booked: <name>" (optional, but it
  shows at a glance which are confirmed).
- **Declined or cancelled:** delete the event. The session frees up on
  the website within a minute or two.
- **A booking by phone, or the room's out of use:** add an event to the
  calendar yourself. An all-day event blocks the whole day, and
  repeating events work too.

The website reads the calendar through `/api/podcast-availability`
(`functions/_lib/podcast-calendar.ts`), which asks the sheet's script
for the times that are taken (never who took them) and shares the answer
for a minute. If the calendar can't be read, for instance before the
updated script is deployed, every date shows as open and the page says
the team will confirm the date is free, so a calendar problem never
stops bookings.

To set it up, deploy the script in `docs/lead-notifications.md` (one
paste and a redeploy), set the script's time zone to Adelaide, and share
the calendar with whoever handles bookings.
