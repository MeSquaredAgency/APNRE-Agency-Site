# Switching apnre.com.au over to this site

`apnre.com.au` is currently served by the old landing page project
(`APNRE-Website`). This repo replaces it: the landlord funnel is already
here at `/landlords/`, with its own form endpoint (`/api/lead`) and
tracking. What's left is moving hosting and ads across, all in
Cloudflare, Google and Meta.

## 1. Set up the new Pages project (no effect on the live site)

1. Cloudflare → **Workers & Pages → Create → Pages** → connect the
   `elliot-apnre/APNRE-Agency-Site` repo.
2. Build command `npm run build`, build output directory `dist`.
3. **Settings → Environment variables** (Production, and Preview):
   - `NODE_VERSION` = `22`
   - `SHEETS_WEBHOOK_URL`: copy the value from the old landing page
     project. Both forms need it.
   - The GTM and Meta Pixel IDs are already in the repo's `.env`, so
     they don't need setting here.
   - Optional, can come later: `VITE_TURNSTILE_SITE_KEY` and
     `TURNSTILE_SECRET` together (`docs/forms.md`), and
     `VITE_GOOGLE_MAPS_API_KEY` (`docs/google-maps.md`).
4. Deploy, and open the `*.pages.dev` address it gives you.

## 2. Test on the preview address

- Submit the form on `/landlords/` with a name like "TEST — ignore".
  It should land on `/landlords/thank-you/` and add a row to the sheet
  with Source `apnre-website / appraisal form`.
- Submit one main-site form (e.g. `/appraisal/`) and check its row
  arrives too. Delete both test rows afterwards.
- Open `/adelaide/`: it should redirect to the contact page.
- Analytics deliberately doesn't run on `*.pages.dev`
  (`src/partials/head-shared.html`), so tracking is tested after the
  switch.

## 3. Check tracking before the switch

In GTM, Google Ads and Meta Events Manager, look for any conversion or
trigger set up as "page URL contains `/thank-you/`". The funnel's
thank-you page moves to `/landlords/thank-you/`, and `/thank-you/` now
receives every enquiry on the site. Either change those rules to
`/landlords/thank-you/`, or use the `generate_lead` event instead (see
`docs/gtm-events.md`). If conversions already use `generate_lead`,
nothing needs changing.

This is the step that matters most: if a rule still looks for
`/thank-you/`, ad reporting will count every enquiry on the site as a
landlord lead.

## 4. The switch (a quiet time; takes a few minutes)

1. In the **old** landing page Pages project, remove the custom domains
   `apnre.com.au` and `www.apnre.com.au`.
2. In the **new** project, add them. If the domain's DNS is on
   Cloudflare, it updates the records for you.
3. Straight away, change the ad links:
   - **Google Ads:** final URL → `https://apnre.com.au/landlords/`
     (keep any tracking parameters).
   - **Meta ads:** website URL → the same.
   - Anything else that points at the old landing page as the landlord
     offer (email signatures, social posts) → `/landlords/` too. The
     Google Business Profile should stay on the homepage.

## 5. Check the live site

- Submit a test on `https://apnre.com.au/landlords/` with GTM's
  **Preview** mode (Tag Assistant) running. Confirm `generate_lead`
  fires and the conversion counts, and check the Pixel with Meta's Pixel
  Helper. Delete the test row after.
- Add `https://apnre.com.au/sitemap.xml` in Google Search Console.

## 6. Tidy up

- Keep the old Pages project, without its domains, for a week or two as
  a fallback. **To roll back, move the two domains back to it.**
- Then archive the `APNRE-Website` repo on GitHub and delete the old
  Pages project.
