# Google address suggestions

The address fields (the home page search bar's Sell and Lease tabs, and
the address on the appraisal and repair forms) suggest real addresses as
you type, using Google Places. Picking one fills in Google's full
address, postcode included, so the address that reaches the enquiry
sheet is one Google can find.

It's off until a key is set. Without one, the fields are ordinary text
boxes and everything else works the same. The code is
`src/lib/places.ts` and `src/components/AddressInput.tsx`.

The landlord campaign page (`go.apnre.com.au/landlords/`) uses the same
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
  - `https://go.apnre.com.au/*` (campaign funnels, `docs/funnels.md`)
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
