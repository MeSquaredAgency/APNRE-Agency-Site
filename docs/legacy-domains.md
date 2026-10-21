# The old domain: adelaidepropertynetwork.com.au

The old brand domain sends everything to `apnre.com.au` with a 301, so
links and search results pointing at it still land on a real page.
`functions/_middleware.ts` does the redirecting: an old page that moved
goes to its new home (`LEGACY_PATHS`), anything else to the same path on
`apnre.com.au`. The query string is kept, so ad click IDs and UTM tags
survive.

## Mapping the real old URLs

`LEGACY_PATHS` holds the usual agency-site addresses (`/about-us/`,
`/property-management/`, `/rentals/`, `/team/` and so on). They're
common patterns, not a confirmed list of the old site's pages. To catch
the real ones:

1. In Google Search Console, add `adelaidepropertynetwork.com.au` as a
   property if it isn't already.
2. **Pages → Not found (404)** on `apnre.com.au`, and **Performance →
   Pages** on the old domain, list addresses that still get visits or
   links. Old analytics (if any) are another source.
3. Add each one that has a sensible new home to `LEGACY_PATHS`, keyed by
   its path without slashes at either end, lowercase. A whole old
   section (`/property-management/anything`) follows its first part.

## Portal profiles

The October 2026 SEO audit also found the old names on the listing
portals, which the site can't fix: rename the commercialrealestate.com.au
profile ("Mount Gambier Property Network") and the RateMyAgent profile
("Adelaide Property Network") to APN Real Estate, and add
`https://apnre.com.au/` as the website on each (the portal links
themselves are in `PORTALS` in `src/data/business.ts`).
