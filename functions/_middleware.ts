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
//                     redirects to the same path on apnre.com.au, so
//                     there's one address to track and rank.
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
    // The page's own noindex tag, repeated as a header.
    return isFunnelPath(path) ? noindex(await context.next()) : context.next();
  }

  // Same path on apnre.com.au, query string and all.
  if (OLD_BRAND_HOSTS.has(host)) return Response.redirect(`https://${MAIN}${withSlash(path)}${url.search}`, 301);

  return noindex(await context.next());
};
