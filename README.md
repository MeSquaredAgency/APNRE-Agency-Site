# APN Real Estate — agency website

The full APN Real Estate site: sales, leasing, property management, team,
offices and enquiries, across Adelaide and Mount Gambier. React +
TypeScript + Vite, static output, hosted on Cloudflare Pages.

This is separate from the landlord campaign landing page
(`APNRE-Website`), which is a single-goal page for paid ads. Brand
tokens, team data, photos, analytics snippets and the approved leasing
copy were carried over from it.

The page structure (split hero with an address search, service tiles,
listings, story, team, offices, a closing call to action; separate
selling, leasing, people, story, contact, careers and repairs pages) is
modelled on a typical full-service agency site. Every word, photo and
claim is APN's own. Don't copy wording, imagery, awards or programmes
from other agencies' sites.

## Pages

All routes are listed in `src/data/routes.json` (path, page title, meta
description). `npm run dev` and `npm run build` first run
`scripts/build-pages.mjs`, which writes one `index.html` per route plus
`public/sitemap.xml`. The generated files are gitignored, so edit
`routes.json` rather than the HTML.

| Path | What it is |
| --- | --- |
| `/` | Home: hero (Sell / Lease / Buy tabs with address search), services, listings, story, team, offices |
| `/selling/` | Selling with APN: reasons, process, sales team, FAQ, sales appraisal form |
| `/leasing/` | Leasing & property management: reasons, process, switching, PM team, FAQ, rental appraisal form |
| `/buy/`, `/rent/`, `/sold/` | Links out to APN's realestate.com.au profile, plus buyer/tenant register forms |
| `/appraisal/` | Sales or rental appraisal form (`?type=sales` or `?type=rental`) |
| `/our-people/` | Team with Sales / Property Management / Leadership filters |
| `/our-story/` | Where APN started, what it does, leadership, offices |
| `/contact/` | Both offices and a general enquiry form |
| `/careers/` | Expression of interest form |
| `/maintenance/` | How tenants report repairs (see below) |
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
  `/maintenance/` tells tenants to call. Only switch it on once someone
  checks those sheet rows every business day. (If APN's property
  management software has a tenant portal, link that instead.)
- [ ] **GTM.** Add a trigger for the custom event `enquiry_form_submit`.
  The landing page's trigger listens for `appraisal_form_submit`, which
  this site doesn't send.
- [ ] **Domain.** The canonical URLs, sitemap and OG tags assume this
  site is served at `https://apnre.com.au`, where the landing page lives
  today. Decide which site takes the root domain and move the other,
  e.g. the landing page to `/landlords/` or a subdomain, before
  deploying both.
- [ ] Have APN review the selling and leasing copy (reasons, process
  steps and FAQs).

## Running it

```bash
npm install
npm run dev       # local dev server (forms fail locally: no /api function)
npm run build     # production build -> dist/
npm run preview   # preview the production build
```
