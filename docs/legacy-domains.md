# Old domains: adelaidepropertynetwork.com.au and mountgambierpropertynetwork.com.au

Both old brand domains send everything to `apnre.com.au` with a 301, so
links and search results pointing at them still land on a real page.
`functions/_middleware.ts` redirects the Adelaide domain, which is a
custom domain on this Pages project; the Mount Gambier one is redirected
by a Cloudflare rule (below).

| Domain | Where it goes |
| --- | --- |
| `adelaidepropertynetwork.com.au` (+ `www`) | The old page's new home (`LEGACY_PATHS`), otherwise the same path on `apnre.com.au` |
| `mountgambierpropertynetwork.com.au` (+ `www`) | `/mount-gambier/` |

The query string is kept, so ad click IDs and UTM tags survive.

## How mountgambierpropertynetwork.com.au is set up

Unlike the Adelaide domain, this one doesn't reach the Pages project.
Its DNS zone is on Cloudflare in the **Me²** account (nameservers
`kolton` / `tegan.ns.cloudflare.com`, set at VentraIP on 21 Oct 2026),
and a Pages project can only attach a bare domain whose zone is in its
own account. So the redirect is a Cloudflare rule on that zone instead:

- **DNS:** `mountgambierpropertynetwork.com.au` and `www` are A records,
  proxied (orange cloud). Their address (VentraIP's old parking IP) is
  never contacted; proxying is only so requests reach Cloudflare's edge.
- **Rules → Redirect Rules:** "Old Mount Gambier domain →
  apnre.com.au/mount-gambier/" sends both hosts, any path, to
  `https://apnre.com.au/mount-gambier/` with a 301, keeping the query
  string. The old site was only a parking page, so there are no old
  paths worth mapping one by one.

Checked live on 21 Oct 2026: http and https, bare and `www`, all 301 to
`/mount-gambier/`. The domain has no MX records, so no email depends on
it. If the zone is ever moved into the APN account, it can be added to
the Pages project as a custom domain instead, and the
`MOUNT_GAMBIER_HOSTS` branch in `functions/_middleware.ts` takes over.

## Mapping the real old URLs

`LEGACY_PATHS` holds the usual agency-site addresses (`/about-us/`,
`/property-management/`, `/rentals/`, `/team/` and so on). They're
common patterns, not a confirmed list of the old sites' pages. To catch
the real ones:

1. In Google Search Console, verify `apnre.com.au` and
   `adelaidepropertynetwork.com.au`, and on the old domain's property use
   **Settings → Change of address** to point it at `apnre.com.au`. (The
   Mount Gambier domain needs no property: it was only ever a parking
   page, so Google has nothing of it to move.)
2. **Pages → Not found (404)** on `apnre.com.au`, and **Performance →
   Pages** on the old domain, list addresses that still get visits or
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
