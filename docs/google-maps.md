# Google address suggestions

The address fields (the home page search bar's Sell and Lease tabs, and
the address on the appraisal and repair forms) suggest real addresses as
you type, using Google Places. Picking one fills in Google's full
address, postcode included, so the address that reaches the enquiry
sheet is one Google can find.

It's off until a key is set. Without one, the fields are ordinary text
boxes and everything else works the same. The code is
`src/lib/places.ts` and `src/components/AddressInput.tsx`.

The landlord campaign page (`apnre.com.au/landlords/`) uses the same
address field, so the key's website restrictions need that host too (see
step 4).

## 1. Create the key

1. Go to [Google Cloud console](https://console.cloud.google.com/),
   signed in with the Google account APN wants to own this, and create a
   project (e.g. "APN website").
2. **Billing:** attach a billing account. Google gives a monthly free
   allowance, and an agency site's address lookups usually stay inside
   it, but a key won't work without billing set up. Set a budget alert
   under **Billing → Budgets & alerts** (e.g. $10) so there are no
   surprises.
3. **APIs & Services → Library**: enable **Maps JavaScript API** and
   **Places API (New)**.
4. **APIs & Services → Credentials → Create credentials → API key**.

## 2. Lock it down

The key is visible to anyone who views the page source (every browser
key is), so the restrictions are what protect it. On the key's page:

- **Application restrictions → Websites**, and add:
  - `https://apnre.com.au/*`
  - `https://www.apnre.com.au/*`
  - `https://*.<your-pages-project>.pages.dev/*` (preview deployments)
  - `http://localhost:5180/*` (only if you want it on the dev server)
- **API restrictions → Restrict key**, and tick only **Maps JavaScript
  API** and **Places API (New)**.

## 3. Add it to Cloudflare

Pages project → **Settings → Environment variables** → add
`VITE_GOOGLE_MAPS_API_KEY` for Production (and Preview, if you want it
there too), then redeploy. It's read at build time, so a change always
needs a new deployment.

## What visitors see, and privacy

- Suggestions appear after three characters, weighted towards South
  Australia but covering all of Australia, with "Powered by Google"
  underneath (Google requires that wherever its suggestions appear
  without a Google map).
- Google's script only loads when someone first clicks into an address
  field, so pages don't carry it otherwise.
- What's typed into the address field goes to Google. The privacy policy
  (`/privacy/`) says so automatically when the key is set.

## Cost

Each time someone types, the page asks Google for suggestions, and
picking one looks up the full address. Google groups those into one
session per address entered, with a debounce so it doesn't send a
request on every keystroke. Check current pricing on Google's Places API
page; the budget alert above is the safety net.

## Google reviews (/landlords/)

The reviews section on `/landlords/` (`src/components/GoogleReviews.tsx`)
shows the latest Google reviews for both offices, with each office's live
rating and review count. It gets them from `/api/reviews`
(`functions/api/reviews.ts`), which asks Google's Places API and caches
the answer at Cloudflare for a day.

This needs a **separate, server-side key**. The address-search key above
is locked to the site's domains, so it can't be used from Cloudflare's
servers.

1. Google Cloud Console (same project) → **APIs & Services →
   Credentials → Create credentials → API key**.
2. Edit the key: **API restrictions → Restrict key → Places API (New)**
   only. Leave **Application restrictions** as None: the key never
   reaches the browser.
3. Cloudflare → Workers & Pages → the site → **Settings → Variables and
   Secrets → Add**: `GOOGLE_PLACES_API_KEY`, type **Secret**, for
   Production and Preview. Then redeploy.

Until the key is set, or if Google doesn't answer, the section shows a
line of copy and buttons to each office's Google reviews and the
realestate.com.au profile, so it never looks broken.

- **Which places:** `src/data/google-places.json` has each office's
  Google Place ID and listing link (Adelaide `ChIJNz8CKfnIsGoRzHWww3xul3A`,
  Mount Gambier `ChIJvxIIZhEnnqoRwqvaZwpi9yc`, found 9 Oct 2026). If a
  Business Profile is ever replaced, look the new one up with Google's
  Place ID Finder and update the file.
- **Which reviews:** Google returns up to five per place, its "most
  relevant", so up to ten in all, newest first. They're shown as written,
  whatever the star rating: no editing and no picking (Google's terms and
  the ACCC both rule that out). To change what shows, get more reviews.
- **Cost:** reviews are a Place Details Enterprise + Atmosphere field.
  With the day-long cache it's a few hundred requests a month at most,
  inside Google's free monthly credit. Check current pricing if traffic
  grows a lot.
- No review or rating markup goes into the structured data: Google
  ignores self-published review stars for local businesses.
