# APN Real Estate — agency website

The full APN Real Estate site at `apnre.com.au`: sales, leasing,
property management, team, offices, blog and enquiries, across Adelaide
and Mount Gambier. React + TypeScript + Vite, pre-rendered static output,
hosted on Cloudflare Pages.

It also carries the landlord campaign page for paid ads at
`/landlords/`, which was the separate `APNRE-Website` repo until
28 Sep 2026 (see "Landlord campaign pages" below). That repo's blog and
office content moved here too, so this is now the only codebase.

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
`scripts/build-pages.mjs`, which writes one `index.html` per route and
the blog template. The generated files are gitignored, so edit
`routes.json` rather than the HTML. The sitemap is written at the end of
the build, once the blog posts are known.

| Path | What it is |
| --- | --- |
| `/` | Home: video hero with Sell / Lease / Find an agent search, key points, listings cards, appraisal feature, team, story, client hub, offices |
| `/selling/` | Selling with APN: reasons, process, sales team, FAQ, sales appraisal form |
| `/leasing/` | Leasing & property management: reasons, process, switching, PM team, FAQ, rental appraisal form |
| `/buy/`, `/rent/`, `/sold/` | Links out to APN's realestate.com.au profile, plus buyer/tenant register forms |
| `/appraisal/sales/`, `/appraisal/rental/` | A sales or rental appraisal form, each its own page for search (`src/pages/Appraisal.tsx`) |
| `/appraisal/` | Both, with a sales/rental switch (`?type=sales` or `?type=rental`), for the header button and older links |
| `/our-people/` | Team with Sales / Property Management / Leadership filters (`?filter=sales`) and a name, role or office search (`?q=`) |
| `/our-people/<name>/` | A page per team member (`src/pages/Person.tsx`), listed in `routes.json`: add one there when someone joins |
| `/our-story/` | Where APN started, what it does, leadership, offices |
| `/contact/` | Both offices and a general enquiry form |
| `/careers/` | Expression of interest form |
| `/client-hub/` | Client hub overview, plus a hub each for `landlords/`, `tenants/` (with repairs), `sellers/` and `buyers/`: quick actions, their team, FAQs and the right form (`src/pages/Hubs.tsx`). The landlord, seller and buyer hubs repeat a lot of `/leasing/` and `/selling/`, so they're noindex to stop them competing in search; the tenant hub is indexed |
| `/blog/`, `/blog/<post>/` | Guides, written as Markdown in `content/blog/`; see `docs/blog.md` |
| `/privacy/`, `/thank-you/` | Privacy policy; post-submit page (noindex) |
| `go.apnre.com.au/landlords/` (+ `thank-you/`) | The landlord campaign funnel for paid ads, and its thank-you page (both noindex). Funnels are served on go.apnre.com.au; see `docs/funnels.md` |

To add a page: add it to `routes.json`, create `src/pages/<Name>.tsx`,
register it in `PAGE_LOADERS` in `src/pages/index.ts`, and link it from
`src/data/nav.ts`.

Old URLs that moved are redirected in `public/_redirects` (e.g. the
landing page's `/adelaide/` and `/mount-gambier/` office pages go to the
offices on `/contact/`). Add a line there whenever a published page moves.

## Campaign funnels (go.apnre.com.au)

Paid-ad landing pages live on `go.apnre.com.au`, one path per funnel,
listed in `src/data/funnels.json`. `functions/_middleware.ts` serves
them there and redirects everything else between the hosts; the full
guide, including a brief template for the marketing exec and UTM
conventions, is `docs/funnels.md`.

### The landlord funnel (`go.apnre.com.au/landlords/`)

The paid-ads landing page, moved in from the `APNRE-Website` repo. It
looks like the rest of apnre.com.au, while its form and tracking stay
exactly as they were, so ad conversions carry on being counted the same
way:

- Built from the main site's pieces: its stylesheet (`src/index.css`),
  fonts, sections (`src/components/sections.tsx`), header, sticky phone
  bar, form styles and address suggestions, plus team, office and
  business data. The page itself (`src/funnels/landlords/App.tsx`) holds
  its own copy, and `src/funnels/landlords/landlords.css` the few styles
  only it needs. Its browser entry is `src/funnels/landlords/main.tsx`.
- Kept to itself so ad visitors stay on the page: the header shows only
  its in-page links, team names aren't linked, and the footer has no
  site menu (just the offices, phone and the form).
- Its own form endpoint, `functions/api/lead.ts` (same Google Sheet;
  Source column `apnre-website / appraisal form`), and its own analytics
  events (`docs/gtm-events.md`). Same field names as before.
- `noindex` and not in the sitemap or the main menu: it's for ad
  traffic, and `/leasing/` is the page for search. The two share copy, so
  keep them in step.

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

Every main-site form posts to `/api/enquiry` (`functions/api/enquiry.ts`);
the landlord page's form posts to `/api/lead`. Both forward to the same
Google Sheet webhook (same columns). Set `SHEETS_WEBHOOK_URL` in the
Cloudflare Pages project's environment variables. The sheet's Source
column says which form it came from, e.g. `apnre agency site / Sales
appraisal`. See `docs/forms.md`.

On success the browser pushes `generate_lead` to GTM (the same event the
landlord page sends, told apart by `event_category`; see
`docs/gtm-events.md`), fires a Meta Pixel `Lead` for appraisals or
`Contact` for other forms, then goes to `/thank-you/`.

## Before launch

- [ ] **Listings.** Every listing link points at the realestate.com.au
  agency profile. When the CRM's feed or API is available, replace
  `LISTINGS_LINKS` in `src/data/nav.ts` with real listing pages.
- [ ] **Repairs form.** `MAINTENANCE_FORM_ENABLED` is `false`, so
  `/client-hub/tenants/#repairs` tells tenants to call. Only switch it on once someone
  checks those sheet rows every business day. (If APN's property
  management software has a tenant portal, link that instead.)
- [ ] **GTM.** Set up the `generate_lead` and `click_to_call` triggers
  and GA4 tags in `docs/gtm-events.md`, if they aren't already. One of
  each covers the whole site.
- [ ] **Switch-over.** Full step-by-step guide: `docs/switch-over.md`.
  This site replaces the `APNRE-Website` deployment
  at `apnre.com.au`. On the day:
  1. In Cloudflare, move the `apnre.com.au` and `www` custom domains
     from the old Pages project to this one, and give this one the same
     environment variables (`SHEETS_WEBHOOK_URL` at least).
  2. Add `go.apnre.com.au` as a custom domain on this project too, then
     change the landing page URL in Google Ads and Meta ads from
     `https://apnre.com.au/` to `https://go.apnre.com.au/landlords/`
     (`docs/funnels.md`). `apnre.com.au/landlords/` still redirects
     there, but each redirect is an extra hop before the page loads.
  3. If any ad conversion is "visited `/thank-you/`", change it to
     `/landlords/thank-you/` (see the end of `docs/gtm-events.md`).
  4. Submit a test on `/landlords/` and on one main-site form, and check
     both rows reach the sheet.
  5. Archive the `APNRE-Website` repo on GitHub, so nobody keeps editing
     the old copy.
- [ ] **Lead emails.** Put the team inboxes into the Apps Script in
  `docs/lead-notifications.md` and redeploy it.
- [ ] **Address suggestions.** Create a restricted Google Maps key and
  set `VITE_GOOGLE_MAPS_API_KEY` (`docs/google-maps.md`). Until then the
  address fields are plain text boxes.
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
