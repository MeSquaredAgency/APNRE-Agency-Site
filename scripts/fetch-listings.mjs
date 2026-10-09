// First step of `npm run pages` (so of `dev` and `build`): writes
// src/data/listings.json, the listings /buy/, /rent/, /sold/ and each
// property's own page are built from. Gitignored, since it changes with
// every listing update. See docs/listings-feed.md.
//
// Where the listings come from:
//   - LISTINGS_FEED_URL and LISTINGS_FEED_TOKEN set (the Cloudflare Pages
//     build): the feed server's bundle of PropertyMe's REAXML files.
//   - `--sample` (npm run dev:sample): the made-up listings in
//     scripts/sample-listings/, to work on the pages locally.
//   - Neither: no listings, so the pages keep linking to realestate.com.au
//     as they did before the feed.
//
// Photos: the feed server keeps WebP copies of PropertyMe's photos and
// floor plans (the bundle's "photos" list). They're downloaded into
// public/listing-photos/ (gitignored), so they ship as ordinary site
// files. A photo the server hasn't copied yet stays on
// /listing-photo/<file>, which fetches it from PropertyMe
// (functions/listing-photo/[file].ts).
//
// If the feed is set up but can't be read, the build fails rather than
// publishing a site with no listings: Cloudflare keeps the last good
// deploy live until the next build works.

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeed } from './reaxml.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/listings.json');
const SAMPLE_DIR = join(ROOT, 'scripts/sample-listings');
const PHOTO_DIR = join(ROOT, 'public/listing-photos');

const { LISTINGS_FEED_URL, LISTINGS_FEED_TOKEN, LISTINGS_AGENT_ID, CF_PAGES } = process.env;

async function feedFiles() {
  if (process.argv.includes('--sample')) {
    // Never on Cloudflare: made-up listings must not reach the live site.
    if (CF_PAGES) throw new Error('--sample is for local development only');
    const files = readdirSync(SAMPLE_DIR)
      .filter((name) => name.endsWith('.xml'))
      .map((name) => ({ name, xml: readFileSync(join(SAMPLE_DIR, name), 'utf8') }));
    return { source: 'sample listings (scripts/sample-listings/)', files, agentId: 'SAMPLE' };
  }
  if (!LISTINGS_FEED_URL) return { source: 'no feed configured', files: [] };
  if (!LISTINGS_FEED_TOKEN) throw new Error('LISTINGS_FEED_URL is set but LISTINGS_FEED_TOKEN is not');

  const res = await fetch(LISTINGS_FEED_URL, {
    headers: { Authorization: `Bearer ${LISTINGS_FEED_TOKEN}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Listings feed: ${LISTINGS_FEED_URL} returned ${res.status}`);
  const bundle = await res.json();
  if (!Array.isArray(bundle.files)) throw new Error('Listings feed: the bundle has no "files" list');
  return {
    source: `feed bundle from ${bundle.generatedAt ?? 'unknown time'}`,
    files: bundle.files,
    photos: bundle.photos ?? {},
    agentId: LISTINGS_AGENT_ID,
  };
}

/** Swaps each /listing-photo/<file> the feed server has a copy of for
 *  /listing-photos/<copy>, downloading the copies a few at a time.
 *  Returns how many were used. */
async function useCopies(listings, photos) {
  const wanted = new Map();
  const want = (file) => {
    wanted.set(file, new URL(`photos/${encodeURIComponent(file)}`, LISTINGS_FEED_URL));
    return `/listing-photos/${file}`;
  };
  const copyOf = (src) => photos[src.match(/^\/listing-photo\/(.+)$/)?.[1] ?? ''];
  /** The copy at up to 1600px, or `src` if there isn't one. */
  const large = (src) => (copyOf(src) ? want(copyOf(src).file) : src);
  /** The 800px copy for cards and thumbnails, or `src`. */
  const small = (src) => {
    const copy = copyOf(src);
    return copy ? want(copy.small ?? copy.file) : src;
  };
  for (const l of listings) {
    if (l.photos) {
      l.thumbs = l.photos.map(small);
      l.photos = l.photos.map(large);
    }
    if (l.floorplans) l.floorplans = l.floorplans.map(large);
  }

  const queue = [...wanted];
  async function worker() {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [file, url] = next;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${LISTINGS_FEED_TOKEN}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Listings feed: photo ${file} returned ${res.status}`);
      writeFileSync(join(PHOTO_DIR, file), Buffer.from(await res.arrayBuffer()));
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  return wanted.size;
}

/** Short links agents paste into descriptions (goo.gl/..., youtu.be/...)
 *  only redirect, which site audits report on every listing that has
 *  one. Same trailing-punctuation rule as linkParts in
 *  src/lib/description.ts, so the keys match its hrefs. */
const SHORT_LINK = /\bhttps?:\/\/(?:goo\.gl|forms\.gle|bit\.ly|tinyurl\.com|youtu\.be|ow\.ly)\/[^\s<>"]+/gi;

/** Where a short link ends up, or undefined if it can't be followed. */
async function linkTarget(url) {
  let current = url;
  try {
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
      const next = res.headers.get('location');
      if (res.status < 300 || res.status >= 400 || !next) return res.ok && current !== url ? current : undefined;
      current = new URL(next, current).href;
    }
  } catch {
    // Offline or timed out: keep linking to the short link.
  }
  return undefined;
}

/** Gives each listing with short links a `linkTargets` map, so its page
 *  links straight to where they go (the text still shows the short link). */
async function resolveShortLinks(listings) {
  let resolved = 0;
  for (const listing of listings) {
    const urls = new Set(
      [...(listing.description ?? '').matchAll(SHORT_LINK)].map((m) => m[0].replace(/[.,;:!?)\]'’]+$/, '')),
    );
    for (const url of urls) {
      const target = await linkTarget(url);
      if (!target) continue;
      listing.linkTargets = { ...listing.linkTargets, [url]: target };
      resolved++;
    }
  }
  return resolved;
}

const { source, files, photos, agentId } = await feedFiles();
const { listings, skipped } = parseFeed(files, { agentId });
const shortLinks = await resolveShortLinks(listings);

// Start empty each time, so photos of listings that have gone don't ship.
rmSync(PHOTO_DIR, { recursive: true, force: true });
mkdirSync(PHOTO_DIR, { recursive: true });
const copied = photos ? await useCopies(listings, photos) : 0;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(listings, null, 2)}\n`);

const count = (section) => listings.filter((l) => l.section === section).length;
console.log(
  `Listings: ${count('buy')} for sale, ${count('rent')} for rent, ${count('sold')} sold, ${count('commercial')} commercial, from ${files.length} file(s) (${source})`,
);
// Leased, withdrawn and off-market listings are skipped on purpose; the
// rest are worth a look in the build log.
for (const reason of skipped) console.log(`  skipped ${reason}`);
if (photos) console.log(`  ${copied} photo(s) and floor plan(s) from the feed server's copies`);
if (shortLinks) console.log(`  ${shortLinks} short link(s) in descriptions now link straight to where they go`);
