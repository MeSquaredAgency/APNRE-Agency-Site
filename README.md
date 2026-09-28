# APN Real Estate — agency website

The full APN Real Estate site: sales, leasing, property management, team,
offices and enquiries, across Adelaide and Mount Gambier. React +
TypeScript + Vite, static output, hosted on Cloudflare Pages.

This is separate from the landlord campaign landing page
(`APNRE-Website`), which is a single-goal page for paid ads. Brand
tokens, team data, photos, analytics snippets and the approved leasing
copy were carried over from it.

The design follows a premium full-service agency pattern: a near-black
header, a full-bleed looping video hero with a search bar, serif
headings, large image cards and a client hub for landlords and tenants.
Every word and claim is APN's own. Don't copy wording, imagery, awards,
statistics or programmes from other agencies' sites.

## Photos and video

- Real APN photography (sold signs, managed properties, team headshots)
  is in `src/assets/`.
- Stock photos and the hero video come from Pexels (free for commercial
  use) and are listed, with credits, in `src/data/media.ts`. Photos are
  served, resized, from Pexels' CDN; the video is re-encoded and hosted
  in `public/video/`. See `docs/media.md`.
- Stock imagery is illustrative only. Never caption a stock shot as an
  APN listing, sale or managed property. The footer notes that some
  imagery is stock.

## Pages

All routes are listed in `src/data/routes.json` (path, page title, meta
description). `npm run dev` and `npm run build` first run
`scripts/build-pages.mjs`, which writes one `index.html` per route plus
`public/sitemap.xml`. The generated files are gitignored, so edit
`routes.json` rather than the HTML.

| Path | What it is |
| --- | --- |
| `/` | Home: video hero with Sell / Lease / Find an agent search, key points, listings cards, appraisal feature, team, story, client hub, offices |
| `/selling/` | Selling with APN: reasons, process, sales team, FAQ, sales appraisal form |
| `/leasing/` | Leasing & property management: reasons, process, switching, PM team, FAQ, rental appraisal form |
| `/buy/`, `/rent/`, `/sold/` | Links out to APN's realestate.com.au profile, plus buyer/tenant register forms |
| `/appraisal/` | Sales or rental appraisal form (`?type=sales` or `?type=rental`) |
| `/our-people/` | Team with Sales / Property Management / Leadership filters (`?filter=sales`) and name search (`?q=`) |
| `/our-story/` | Where APN started, what it does, leadership, offices |
| `/contact/` | Both offices and a general enquiry form |
| `/careers/` | Expression of interest form |
| `/client-hub/` | Landlord hub, tenant hub, and how to report repairs (see below) |
| `/privacy/`, `/thank-you/` | Privacy policy; post-submit page (noindex) |

To add a page: add it to `routes.json`, create `src/pages/<Name>.tsx`,
register it in `PAGES` in `src/main.tsx`, and link it from
`src/data/nav.ts`.

## Where content lives

- `src/data/business.ts`: phone, ACN/RLA, REA profile URL, feature flags
- `src/data/offices.ts`: both offices
- `src/data/team.ts`: people, roles, bios, and which team filters they
  appear under
- `src/data/nav.ts`: header menu, footer links, listing links
- Page copy lives in each page file under `src/pages/`

Keep claims verifiable: no sales figures, rankings, awards, review
scores or testimonials unless they're real, current and approved.

## Forms

Every form posts to `/api/enquiry` (`functions/api/enquiry.ts`), which
forwards it to the same Google Sheet webhook the landing page uses (same
columns). Set `SHEETS_WEBHOOK_URL` in the Cloudflare Pages project's
environment variables. The sheet's Source column says which form it came
from, e.g. `apnre agency site / Sales appraisal`. See `docs/forms.md`.

On success the browser pushes `enquiry_form_submit` (with `form_name`)
to GTM, fires a Meta Pixel `Lead` for appraisals or `Contact` for other
forms, then goes to `/thank-you/`.

## Before launch

- [ ] **Listings.** Every listing link points at the realestate.com.au
  agency profile. When the CRM's feed or API is available, replace
  `LISTINGS_LINKS` in `src/data/nav.ts` with real listing pages.
- [ ] **Repairs form.** `MAINTENANCE_FORM_ENABLED` is `false`, so
  `/client-hub/#repairs` tells tenants to call. Only switch it on once someone
  checks those sheet rows every business day. (If APN's property
  management software has a tenant portal, link that instead.)
- [ ] **GTM.** Add a trigger for the custom event `enquiry_form_submit`.
  The landing page's trigger listens for `appraisal_form_submit`, which
  this site doesn't send.
- [ ] **Domain.** This site takes `https://apnre.com.au` (decided
  28 Sep 2026). The landlord landing page, which is there today, moves
  under it before this goes live, and paid ads need their URLs updated
  to match.
- [ ] **Lead emails.** Put the team inboxes into the Apps Script in
  `docs/lead-notifications.md` and redeploy it.
- [ ] **Spam check.** Create the Turnstile keys and set
  `VITE_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET` together
  (`docs/forms.md`).
- [ ] **Analytics host.** GTM and the Meta Pixel only run on
  `apnre.com.au` / `www.apnre.com.au` (`src/partials/head-shared.html`),
  so previews and local testing don't pollute APN's data. Add a hostname
  there if the site is ever served from another one.
- [ ] Have APN review the selling and leasing copy (reasons, process
  steps and FAQs).

## How the build works

`npm run build`:

1. `scripts/build-pages.mjs` writes an HTML file per route
   (`src/data/routes.json`), the sitemap, and each page's link-preview
   image (`scripts/og-images.mjs`).
2. Vite builds the browser code, turning `?photo` imports into WebP and
   JPEG copies (see `docs/media.md`).
3. A server build of `src/server.tsx` renders every page, and
   `scripts/prerender.mjs` writes that markup into each HTML file, so
   search engines and link previews see the full page without running
   JavaScript.
4. In the browser, `src/main.tsx` loads the page's code and hydrates the
   markup in place.

For hydration to work, a page must render the same thing at build time
and on first load in the browser. So nothing reads `window.location`,
the query string or storage while rendering: the current path comes
from `src/lib/route.ts`, and anything else (e.g. `?type=` on
`/appraisal/`, `?filter=` on `/our-people/`) is read in an effect.

`public/_headers` sets security headers, and caching for the built
assets and the video.

## Running it

```bash
npm install
npm run dev       # local dev server: renders in the browser, no pre-rendering; forms fail (no /api function)
npm run build     # production build -> dist/, pre-rendered
npm run preview   # serve dist/ to check the pre-rendered site
```
