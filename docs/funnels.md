# Campaign funnels

Every paid-ad landing page ("funnel") lives on **apnre.com.au**, one
path per funnel:

| Funnel | Address | Form goes to |
| --- | --- | --- |
| Landlord rental appraisal | https://apnre.com.au/landlords/ | `/api/lead` → the enquiry sheet |

Funnel pages are for ad traffic: they're noindex, kept out of the
sitemap, and link back into the rest of the site only through the logo
and privacy policy. They're built in this repo, from the same team data,
brand, forms and tracking as the main site, so there's one codebase and
one deployment.

## For the marketing exec

### Briefing a new funnel

Send a brief with these answers. Anything you don't know yet can be left
as "TBC"; the page won't go live with placeholders.

1. **Name and address.** e.g. "Seller appraisal", at `apnre.com.au/sellers/`
   (lowercase, hyphens, short).
2. **Audience and offer.** Who is the ad aimed at, and what do they get?
   (e.g. "Owners in Adelaide's north thinking of selling in the next
   6 months: a free sales appraisal.")
3. **Ad platforms.** Google Ads, Meta, both, other.
4. **Headline and key message.** Or leave it to us to draft from the offer.
5. **The form.** What to ask (keep it short: name, phone, email, address
   usually does it), and who should be told about each lead.
6. **Proof points.** Only real, current, approved ones: testimonials
   (quoted exactly, with the client's OK), results, team members to
   feature. No invented stats or awards.
7. **Photos.** Real APN photos if you have them; otherwise we use
   neutrally captioned stock.
8. **Launch date and end date** (if it's a limited campaign).
9. **What counts as a conversion**, e.g. "form submitted".

Turnaround for a new funnel is usually a day or two from a complete
brief; copy or photo changes to a live one, same day.

### Linking to a funnel from an ad

Always tag the link, so every lead can be traced
back to its ad:

```
https://apnre.com.au/landlords/?utm_source=google&utm_medium=cpc&utm_campaign=landlords-2026-10
```

| Tag | Use | Examples |
| --- | --- | --- |
| `utm_source` | The platform | `google`, `facebook`, `instagram` |
| `utm_medium` | The type of traffic | `cpc` (search ads), `paid_social` |
| `utm_campaign` | Funnel + month or name | `landlords-2026-10` |
| `utm_content` (optional) | Which ad or creative | `video-a`, `carousel-b` |

Lowercase, hyphens, no spaces. Google Ads adds `gclid` and Meta adds
`fbclid` on their own; don't remove them. Every redirect on the site
keeps these tags, so an old `adelaidepropertynetwork.com.au/landlords/`
link still tracks correctly.

**Don't use go.apnre.com.au.** It served the funnels until 8 Oct 2026
and is now the Short.io short-link domain, so a go. link only works if
there's a matching short link in Short.io.

### Tracking

Each funnel form sends a `generate_lead` event to Google Tag Manager
(with the funnel in `event_category` / `form_name`) and a Meta Pixel
`Lead`. See `docs/gtm-events.md`. Set conversions up on that event, not
on "visited a thank-you page": every funnel has its own thank-you page,
and the main site has another.

Analytics only runs on the live domains, so testing on a
`*.pages.dev` preview doesn't count as a conversion.

## For developers: adding a funnel

1. **Code:** create `src/funnels/<id>/` with a `main.tsx` entry and its
   page(s). `src/funnels/landlords/` is the pattern: the main site's
   stylesheet and sections (`src/components/sections.tsx`), so the
   funnel looks like apnre.com.au; the main header with the `funnel`
   option (only the page's own links and button); a small stylesheet of
   its own for anything the main site doesn't have; and its form posting
   to an endpoint in `functions/api/`. Keep visitors on the page: no
   links into the main site beyond the logo and privacy policy.
2. **Register it** in `src/data/funnels.json`: `id`, `name`, `path`
   (with trailing slash), `entry` and its share image (`og.image` in
   `public/`, `og.alt`).
3. **Routes:** add its page(s) to `src/data/routes.json` with
   `"funnel": "<id>"` and `"noindex": true`, and to `FUNNEL_LOADERS` in
   `src/server.tsx`.
4. **Form:** either reuse `/api/enquiry` with a new enquiry type (see
   `docs/forms.md`), or add an endpoint like `functions/api/lead.ts`. Put
   the funnel's name in the sheet's Source column, and add a routing rule
   in the Apps Script (`docs/lead-notifications.md`) so the right person
   hears about each lead.
5. **Build and test** on the Cloudflare preview address: page loads,
   form writes a row, thank-you page shows.

That's all the host handling needs: `functions/_middleware.ts` reads
`funnels.json`, so the new path automatically gets its noindex header.

## How the hosts work

`functions/_middleware.ts` runs before every page request (static files
skip it via `public/_routes.json`):

- **apnre.com.au / www.:** everything is served; funnel paths also get an
  `X-Robots-Tag: noindex` header.
- **adelaidepropertynetwork.com.au / www.:** everything redirects (301)
  to the same path on apnre.com.au.
- **Anything else** (e.g. `*.pages.dev` previews): untouched, so the whole
  site, funnels included, can be tested on one preview address.

All redirects keep the query string.

## One-time setup (done once, not per funnel)

Nothing beyond the main site's: the Google Maps key and Turnstile widget
already allow apnre.com.au (`docs/google-maps.md`, `docs/forms.md`).
