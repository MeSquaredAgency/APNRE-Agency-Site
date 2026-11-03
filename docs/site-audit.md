# Site audit warnings that are expected

Crawlers like Ahrefs Site Audit flag some things on apnre.com.au that
are deliberate. Checked against the 29 Oct 2026 Ahrefs crawl.

## Noindex pages ("Noindex page", "Noindex follow page")

These carry `<meta name="robots" content="noindex">` on purpose:

| Page | Why |
| --- | --- |
| `/client-hub/landlords/`, `/client-hub/sellers/`, `/client-hub/buyers/` | They repeat `/leasing/` and `/selling/`, so they'd compete with them in search (`noindex` in `src/data/routes.json`) |
| `/rent/`, `/sold/` (and `/buy/`, `/commercial/` when empty) | Empty listing sections are only a pointer to realestate.com.au, which Google reports as a soft 404. They're indexed again as soon as the feed brings a listing (`scripts/routes.mjs`) |
| `/thank-you/`, `/landlords/`, `/landlords/thank-you/` | Post-submit page and the paid-ads funnel (`docs/funnels.md`) |

"Noindex" without "nofollow" means search engines still follow their
links, which is what we want. Only change one of these if the page's
purpose changes.

## Redirects ("3XX redirect", "HTTP to HTTPS redirect")

`http://`, `www.` and `http://www.` all 301 to `https://apnre.com.au/`
in one hop (Cloudflare). No link on the site points at a redirecting
URL: every internal link, canonical, sitemap entry and `llms.txt` URL
returned 200 when checked on 1 Nov 2026.

The Ahrefs project's start URL is `http://apnre.com.au/`, so the crawl
begins on a redirect and reports it. Change the project's URL to
`https://apnre.com.au/` in Ahrefs (Site Audit, project settings) to
clear these. If Ahrefs then still reports a redirect, its report names
the page that links to it; fix that link or add a `public/_redirects`
line.

## Structured data

- Home, contact and office pages: the organisation and a
  `RealEstateAgent` per office (`scripts/build-pages.mjs`). Each office's
  `hasMap` and `sameAs` are its Google Business Profile
  (`src/data/google-places.json`); Adelaide has its office photo as
  `image`, Mount Gambier will once its photo is supplied. No map
  coordinates until someone confirms them.
- Team pages and `/our-people/`: a `Person` each, with their headshot as
  `image`.
- Blog posts: `BlogPosting` (`src/blog-server.tsx`).
- Guides outside the blog, like `/leasing/switching-property-managers/`:
  `Article`, from `article()` in `src/structured-data.ts`. Use it for any
  new guide page.

## "Page and SERP titles do not match"

Google sometimes shows its own title instead of the page's `<title>`.
Ahrefs' report names the page and the title Google shows. Compare the
two: if Google's is clearer, update the title in `src/data/routes.json`
(or the post's `seoTitle`), keeping it under about 60 characters.
Where the full " | APN Real Estate" doesn't fit, end with " | APN"
instead (as `/leasing/`, `/buy/` and the appraisal pages do) rather than
dropping the phrase people search for. Listing pages' titles are made in
`scripts/routes.mjs`.
