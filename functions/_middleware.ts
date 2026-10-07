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
// and UTM tags survive it, and adds the trailing slash pages live at, so
// it's one hop rather than two. A path under a funnel that doesn't exist
// (like /landlords/{ignore}, from an ad URL) redirects to the funnel
// rather than showing the 404 page. Any other host, like *.pages.dev preview
// deployments, serves everything so it can be tested there, but with an
// X-Robots-Tag: noindex header so previews never show up in search.

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

/** /landlords → /landlords/, so the redirect lands on the page itself
 *  rather than on Pages' own trailing-slash redirect. */
const withSlash = (path: string) => (isFile(path) || path.endsWith('/') ? path : `${path}/`);

function redirect(host: string, url: URL, status: 301 | 302): Response {
  return Response.redirect(`https://${host}${withSlash(url.pathname)}${url.search}`, status);
}

/** The response as-is, plus an X-Robots-Tag header. */
function noindex(response: Response): Response {
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}

/** A funnel page, or for a path under a funnel that doesn't exist, a
 *  redirect to the funnel itself. Ad URLs pick up junk after the path
 *  (an unfilled "{ignore}" or "{lpurl}" placeholder, a typo), and paid
 *  clicks must land on the form, not the 404 page. 302 because the junk
 *  isn't a page that moved. */
async function funnelPage(context: EventContext<unknown, string, unknown>, url: URL): Promise<Response> {
  const response = await context.next();
  const funnel = FUNNEL_PATHS.find((p) => url.pathname.startsWith(p) && url.pathname !== p);
  if (response.status !== 404 || !funnel || isFile(url.pathname)) return noindex(response);
  return Response.redirect(`${url.origin}${funnel}${url.search}`, 302);
}

/** go. only holds noindex funnel pages, so it gets its own robots.txt
 *  with no sitemap (the main one lists apnre.com.au pages). Crawling stays
 *  allowed: a crawler has to fetch a page to see its noindex tag. */
const GO_ROBOTS = 'User-agent: *\nAllow: /\n';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const { hostname: host, pathname: path } = url;

  if (host === GO) {
    if (path === '/robots.txt') {
      return new Response(GO_ROBOTS, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    // The page's own noindex tag, repeated as a header, which also
    // covers anything served here that isn't HTML.
    if (isFunnelPath(path)) return funnelPage(context, url);
    if (isApi(path) || isFile(path)) return noindex(await context.next());
    // 302, not 301: the root of go. may become a funnel directory later.
    return redirect(MAIN, url, 302);
  }

  if (MAIN_HOSTS.has(host)) {
    if (isFunnelPath(path)) return redirect(GO, url, 301);
    return context.next();
  }

  // Old ad links to the funnel go straight to go., not via apnre.com.au.
  if (OLD_BRAND_HOSTS.has(host)) return redirect(isFunnelPath(path) ? GO : MAIN, url, 301);

  if (isFunnelPath(path)) return funnelPage(context, url);
  return noindex(await context.next());
};
