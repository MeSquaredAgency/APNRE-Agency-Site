// Runs in front of every page request (static files skip it; see
// public/_routes.json) and sends each one to the right host:
//
//   apnre.com.au      The main site, campaign funnels included
//   www.apnre.com.au  (src/data/funnels.json, e.g. apnre.com.au/landlords/).
//                     Funnel pages are for ad traffic, so they carry an
//                     X-Robots-Tag: noindex header on top of their own
//                     noindex tag.
//
//   adelaidepropertynetwork.com.au   The old brand's domain: everything
//                     redirects to apnre.com.au, so there's one address
//                     to track and rank. Old pages that moved go to
//                     their new home (LEGACY_PATHS below), anything else
//                     to the same path.
//
// See docs/legacy-domains.md.
//
// go.apnre.com.au used to serve the funnels. Since October 2026 it's APN
// Real Estate's Short.io short-link domain, so it never reaches this
// site; ads point at apnre.com.au/<funnel>/ instead (docs/funnels.md).
//
// Every redirect keeps the query string, so ad click IDs (gclid, fbclid)
// and UTM tags survive it, and adds the trailing slash pages live at, so
// it's one hop rather than two. Any other host, like *.pages.dev preview
// deployments, serves everything so it can be tested there, but with an
// X-Robots-Tag: noindex header so previews never show up in search.

import config from '../src/data/funnels.json';

const MAIN = new URL(config.origin).hostname;
const MAIN_HOSTS = new Set([MAIN, `www.${MAIN}`]);
const OLD_BRAND_HOSTS = new Set(['adelaidepropertynetwork.com.au', 'www.adelaidepropertynetwork.com.au']);

/** Where the old site's usual addresses went, by path without slashes at
 *  either end (lowercase). These are common patterns for agency sites,
 *  not a confirmed list of the old pages: add the real ones from Search
 *  Console as they turn up (docs/legacy-domains.md). A path that already
 *  exists on apnre.com.au (/contact/, /sold/...) needs no entry. Applied
 *  on apnre.com.au too, so a stray link there gets the same answer. */
const LEGACY_PATHS: Record<string, string> = {
  'about': '/our-story/',
  'about-us': '/our-story/',
  'our-team': '/our-people/',
  'team': '/our-people/',
  'staff': '/our-people/',
  'agents': '/our-people/',
  'contact-us': '/contact/',
  'property-management': '/leasing/',
  'property-managers': '/leasing/',
  'landlord': '/leasing/',
  'rental-appraisal': '/appraisal/rental/',
  'free-rental-appraisal': '/appraisal/rental/',
  'sales-appraisal': '/appraisal/sales/',
  'market-appraisal': '/appraisal/sales/',
  'free-appraisal': '/appraisal/',
  'sell': '/selling/',
  'for-sale': '/buy/',
  'buying': '/buy/',
  'properties': '/buy/',
  'listings': '/buy/',
  'rentals': '/rent/',
  'rental': '/rent/',
  'for-rent': '/rent/',
  'lease': '/rent/',
  'tenants': '/client-hub/tenants/',
  'tenant': '/client-hub/tenants/',
  'maintenance': '/client-hub/tenants/#repairs',
  'repairs': '/client-hub/tenants/#repairs',
  'news': '/blog/',
};

/** Where an old address now lives: LEGACY_PATHS, or a whole old section
 *  (/property-management/anything) by its first part. */
function legacyTarget(path: string): string | undefined {
  const key = path.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (key in LEGACY_PATHS) return LEGACY_PATHS[key];
  const first = key.split('/')[0];
  return key.includes('/') && first in LEGACY_PATHS && !isFile(path) ? LEGACY_PATHS[first] : undefined;
}

const FUNNEL_PATHS = config.funnels.map((f) => f.path);

/** /landlords, /landlords/ and anything under /landlords/. */
function isFunnelPath(path: string): boolean {
  return FUNNEL_PATHS.some((p) => path === p.slice(0, -1) || path.startsWith(p));
}

/** Anything with a file extension (images, robots.txt, sitemap.xml...). */
const isFile = (path: string) => /\/[^/]+\.[a-z0-9]+$/i.test(path);

/** /contact → /contact/, so the redirect lands on the page itself rather
 *  than on Pages' own trailing-slash redirect. */
const withSlash = (path: string) => (isFile(path) || path.endsWith('/') ? path : `${path}/`);

/** A 301 to `target` on apnre.com.au, keeping the query string. A target
 *  with a #fragment keeps it after the query. */
function moved(target: string, search: string): Response {
  const [path, hash = ''] = target.split('#');
  return Response.redirect(`https://${MAIN}${path}${search}${hash ? `#${hash}` : ''}`, 301);
}

/** The response as-is, plus an X-Robots-Tag header. */
function noindex(response: Response): Response {
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const { hostname: host, pathname: path } = url;

  if (MAIN_HOSTS.has(host)) {
    const target = legacyTarget(path);
    if (target) return moved(target, url.search);
    // The page's own noindex tag, repeated as a header.
    return isFunnelPath(path) ? noindex(await context.next()) : context.next();
  }

  // Its new home on apnre.com.au, or the same path, query string and all.
  if (OLD_BRAND_HOSTS.has(host)) return moved(legacyTarget(path) ?? withSlash(path), url.search);

  return noindex(await context.next());
};
