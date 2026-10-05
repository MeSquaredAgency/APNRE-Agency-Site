// Cloudflare Pages Function — /listing-photo/<file> serves a listing photo
// or floor plan from PropertyMe's feed. PropertyMe hosts them at
// http://docs.propertyme.com/listing/<file>, which has no https, and an
// https page can't show http images, so the site fetches them here
// instead (scripts/reaxml.mjs points the pages at this path). See
// docs/listings-feed.md.
//
// It only ever fetches from that one PropertyMe folder, and only image
// file names, so it can't be used to load anything else through the site.
// Each file's name is unique to that upload (a new photo gets a new name),
// so it can be cached for a long time.

const ORIGIN = 'http://docs.propertyme.com/listing/';
const FILE = /^[\w-]+\.(?:jpe?g|png|gif|webp)$/i;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export const onRequestGet: PagesFunction = async ({ params }) => {
  const file = String(params.file ?? '');
  if (!FILE.test(file)) return new Response('Not found', { status: 404 });

  const upstream = await fetch(ORIGIN + file, {
    // Cache PropertyMe's copy at Cloudflare's edge, so most requests
    // never reach PropertyMe.
    cf: { cacheEverything: true, cacheTtl: 60 * 60 * 24 * 30 },
  });
  const type = (upstream.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (!upstream.ok || !TYPES.has(type)) {
    // Gone from PropertyMe (e.g. the photo was replaced): a short-lived
    // 404, so it's retried rather than remembered.
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=2592000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
