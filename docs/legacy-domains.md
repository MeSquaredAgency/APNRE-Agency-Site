# Old domains: adelaidepropertynetwork.com.au and mountgambierpropertynetwork.com.au

Both old brand domains should send everything to `apnre.com.au` with a
301, so links and search results pointing at them still land on a real
page. `functions/_middleware.ts` does the redirecting; each domain only
needs to reach this Pages project.

| Domain | Where it goes |
| --- | --- |
| `adelaidepropertynetwork.com.au` (+ `www`) | The old page's new home (`LEGACY_PATHS`), otherwise the same path on `apnre.com.au` |
| `mountgambierpropertynetwork.com.au` (+ `www`) | The old page's new home (`LEGACY_PATHS`), otherwise `/mount-gambier/` |

The query string is kept, so ad click IDs and UTM tags survive.

## Connecting mountgambierpropertynetwork.com.au

As of the October 2026 SEO audit it was still parked at VentraIP
(a parking page over http, and https failing), and not redirected. The
code is ready; the domain needs pointing here:

1. Cloudflare → **Workers & Pages** → this project → **Custom domains**
   → add `mountgambierpropertynetwork.com.au`, then
   `www.mountgambierpropertynetwork.com.au`. Cloudflare shows the DNS
   records it needs.
2. Either move the domain's DNS to Cloudflare (easiest: Cloudflare then
   adds the records and the certificate itself), or, in VentraIP's DNS
   manager, turn off parking and add the CNAME records Cloudflare showed
   (for the bare domain, VentraIP may need a CNAME-flattening or ALIAS
   record; if it doesn't offer one, move the DNS to Cloudflare).
3. Wait for both to show **Active** in Cloudflare, then check
   `https://mountgambierpropertynetwork.com.au/` and the `www` one both
   301 to `https://apnre.com.au/mount-gambier/`.

## Mapping the real old URLs

`LEGACY_PATHS` holds the usual agency-site addresses (`/about-us/`,
`/property-management/`, `/rentals/`, `/team/` and so on). They're
common patterns, not a confirmed list of the old sites' pages. To catch
the real ones:

1. In Google Search Console, add `adelaidepropertynetwork.com.au` (and the
   Mount Gambier domain) as properties if they aren't already.
2. **Pages → Not found (404)** on `apnre.com.au`, and **Performance →
   Pages** on the old domains, list addresses that still get visits or
   links. Old analytics (if any) are another source.
3. Add each one that has a sensible new home to `LEGACY_PATHS`, keyed by
   its path without slashes at either end, lowercase. A whole old
   section (`/property-management/anything`) follows its first part.

## Portal profiles

The audit also found the old names on the listing portals, which the
site can't fix: rename the commercialrealestate.com.au profile ("Mount
Gambier Property Network") and the RateMyAgent profile ("Adelaide
Property Network") to APN Real Estate, and add `https://apnre.com.au/`
as the website on each (the portal links themselves are in
`PORTALS` in `src/data/business.ts`).
