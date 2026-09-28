// Runs in front of every page request (static files skip it; see
// public/_routes.json) and sends each one to the right host:
//
//   go.apnre.com.au   Campaign funnels only (src/data/funnels.json). A
//                     funnel's pages, the form endpoints and files load
//                     here; anything else, including the bare root,
//                     belongs to the main site and redirects there.
//   apnre.com.au      The main site. A funnel path here (an old ad link,
//   www.apnre.com.au  e.g. apnre.com.au/landlords/) redirects to go.
//
//   adelaidepropertynetwork.com.au   The old brand's domain: everything
//                     redirects to the same path on apnre.com.au, so
//                     there's one address to track and rank.
//
// Every redirect keeps the query string, so ad click IDs (gclid, fbclid)
// and UTM tags survive it. Any other host, like *.pages.dev preview
// deployments, is left alone so everything can be tested there.

import config from '../src/data/funnels.json';

const MAIN = 'apnre.com.au';
const GO = new URL(config.origin).hostname;
const MAIN_HOSTS = new Set([MAIN, `www.${MAIN}`]);
const OLD_BRAND_HOSTS = new Set(['adelaidepropertynetwork.com.au', 'www.adelaidepropertynetwork.com.au']);

const FUNNEL_PATHS = config.funnels.map((f) => f.path);

/** /landlords, /landlords/ and anything under /landlords/. */
function isFunnelPath(path: string): boolean {
  return FUNNEL_PATHS.some((p) => path === p.slice(0, -1) || path.startsWith(p));
}

/** Form endpoints, which funnel pages post to on their own host. */
const isApi = (path: string) => path.startsWith('/api/');

/** Anything with a file extension (images, robots.txt, sitemap.xml...):
 *  served as-is on any host. The big asset folders never reach this
 *  function at all (public/_routes.json). */
const isFile = (path: string) => /\/[^/]+\.[a-z0-9]+$/i.test(path);

function redirect(host: string, url: URL, status: 301 | 302): Response {
  return Response.redirect(`https://${host}${url.pathname}${url.search}`, status);
}

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const { hostname: host, pathname: path } = url;

  if (host === GO) {
    if (isFunnelPath(path) || isApi(path) || isFile(path)) return context.next();
    // 302, not 301: the root of go. may become a funnel directory later.
    return redirect(MAIN, url, 302);
  }

  if (MAIN_HOSTS.has(host) && isFunnelPath(path)) return redirect(GO, url, 301);

  if (OLD_BRAND_HOSTS.has(host)) return redirect(MAIN, url, 301);

  return context.next();
};
