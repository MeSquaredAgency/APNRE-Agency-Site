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
// It also writes the listing pages' link-preview photos (ogImages
// below), and the redirects for listing pages that have moved or gone
// (parseFeed in scripts/reaxml.mjs) to REDIRECTS_OUT, which
// scripts/prerender.mjs adds to dist/_redirects at the end of the build.
//
// If the feed is set up but can't be read, the build fails rather than
// publishing a site with no listings: Cloudflare keeps the last good
// deploy live until the next build works.

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parseFeed } from './reaxml.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/listings.json');
const SAMPLE_DIR = join(ROOT, 'scripts/sample-listings');
const PHOTO_DIR = join(ROOT, 'public/listing-photos');
/** The gallery grid and listing cards show photos about 300-400px wide,
 *  so each 800px copy also gets one this wide (made here with sharp),
 *  rather than every thumbnail loading at twice the size it's shown. */
const TILE_WIDTH = 400;
/** The main photo is the listing page's largest image (its LCP). A phone
 *  shows it about 360px wide, so at 3x it wants about 1100px: with only
 *  800px and 1600px copies it got the 1600px one (about 260 KB). So the
 *  main photo also gets a copy this wide, made from the 1600px one. */
const MAIN_WIDTH = 1200;
/** Link previews: Facebook, LinkedIn and some messaging apps don't show
 *  WebP, and crop to about 1.91:1, so each listing's main photo also gets
 *  a JPEG this size (ogImages). */
const OG_SIZE = { width: 1200, height: 630 };
/** Where the redirects for listing pages that have moved or gone are
 *  kept between this step and scripts/prerender.mjs: a build cache, not
 *  part of the site, and never committed (node_modules is gitignored). */
const REDIRECTS_OUT = join(ROOT, 'node_modules/.cache/apn-listing-redirects.json');

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

  // The 400px tiles, from the 800px copies just downloaded.
  const tileOf = (src) => src.replace(/(\.\w+)$/, `-${TILE_WIDTH}w$1`);
  const tiles = new Set();
  for (const l of listings) {
    if (!l.thumbs) continue;
    l.tiles = l.thumbs.map((src) => {
      if (!src.startsWith('/listing-photos/')) return src;
      tiles.add(src);
      return tileOf(src);
    });
  }
  await Promise.all(
    [...tiles].map((src) => {
      const file = join(ROOT, 'public', src);
      return sharp(file).resize({ width: TILE_WIDTH, withoutEnlargement: true }).toFile(join(ROOT, 'public', tileOf(src)));
    }),
  );

  // The main photo's 1200px copy (MAIN_WIDTH), from the 1600px one, when
  // that's wider than 1200px.
  const mainOf = (src) => src.replace(/(\.\w+)$/, `-${MAIN_WIDTH}w$1`);
  await Promise.all(
    listings.map(async (l) => {
      const src = l.photos?.[0];
      if (!src?.startsWith('/listing-photos/') || src === l.thumbs?.[0]) return;
      const file = join(ROOT, 'public', src);
      if (((await sharp(file).metadata()).width ?? 0) <= MAIN_WIDTH) return;
      await sharp(file).resize({ width: MAIN_WIDTH }).toFile(join(ROOT, 'public', mainOf(src)));
      l.mainPhoto1200 = mainOf(src);
    }),
  );
  return wanted.size;
}

/** Each listing page's link-preview photo: its main photo as a 1200 x 630
 *  JPEG in public/listing-photos/ (`ogImage`), named after the photo it's
 *  made from so a new main photo gets a new file (they're cached for a
 *  year). From the feed server's copy where there is one; otherwise the
 *  photo is downloaded (PropertyMe's over http, which is fine here at
 *  build time). A photo that can't be read keeps the page on its WebP
 *  main photo, as before. */
async function ogImages(listings) {
  let made = 0;
  await Promise.all(
    listings.map(async (l) => {
      const src = l.photos?.[0];
      if (!src || l.apnBuilding === 'blair-athol') return;
      const name = `og-${createHash('sha1').update(src).digest('hex').slice(0, 16)}.jpg`;
      try {
        let input;
        if (src.startsWith('/listing-photos/')) input = join(ROOT, 'public', src);
        else {
          const pm = src.match(/^\/listing-photo\/(.+)$/);
          const url = pm ? `http://docs.propertyme.com/listing/${pm[1]}` : src;
          if (!/^https?:\/\//.test(url)) return;
          const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
          if (!res.ok) throw new Error(`returned ${res.status}`);
          input = Buffer.from(await res.arrayBuffer());
        }
        await sharp(input)
          .resize({ ...OG_SIZE, fit: 'cover' })
          .jpeg({ quality: 78, mozjpeg: true })
          .toFile(join(PHOTO_DIR, name));
        l.ogImage = `/listing-photos/${name}`;
        made++;
      } catch (err) {
        console.log(`  no link-preview JPEG for ${l.path} (${err.message}); using its main photo`);
      }
    }),
  );
  return made;
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

/** The chat assistant's copy of the listings (functions/api/chat.ts reads
 *  it like llms.txt): plain text, one block per listing, with what a
 *  visitor is likely to ask about and the listing's own page. Rebuilt with
 *  every deploy, so it's as current as the listing pages. */
const CHAT_OUT = join(ROOT, 'public/chat-listings.txt');
const SECTION_NAMES = {
  buy: 'For sale',
  rent: 'For rent (homes)',
  commercial: 'Commercial for lease',
  sold: 'Recently sold',
};
function chatListings(listings) {
  const today = new Date().toISOString().slice(0, 10);
  const parts = [`Listings on apnre.com.au as of the last site build (${today}).`];
  for (const [section, name] of Object.entries(SECTION_NAMES)) {
    const group = listings.filter((l) => l.section === section);
    parts.push(`\n## ${name} (${group.length})`);
    if (!group.length) parts.push('None at the moment.');
    for (const l of group) {
      const address = [l.street, l.suburb, l.postcode].filter(Boolean).join(', ');
      const rooms = [
        l.bedrooms != null && `${l.bedrooms} bed`,
        l.bathrooms != null && `${l.bathrooms} bath`,
        l.carSpaces != null && `${l.carSpaces} car`,
      ].filter(Boolean);
      // The Blair Athol office rooms have no listing page; /office-space/
      // has their details and prices.
      const blairAthol = l.apnBuilding === 'blair-athol';
      const lines = [
        `- ${address} (${l.category ?? l.propertyType})`,
        `  Page: ${blairAthol ? '/office-space/ (APN’s own building: see that page for rooms and prices)' : l.path}`,
      ];
      if (l.apnBuilding === 'mount-gambier') lines.push('  In APN’s own Mount Gambier building');
      if (l.headline) lines.push(`  Headline: ${l.headline}`);
      if (!blairAthol) {
        lines.push(`  ${section === 'sold' ? 'Result' : 'Price'}: ${l.price ?? 'Contact agent'}${l.underOffer ? ' (under offer)' : ''}`);
      }
      if (rooms.length) lines.push(`  ${rooms.join(', ')}`);
      if (l.landArea) lines.push(`  Land: ${l.landArea}`);
      if (l.buildingArea) lines.push(`  Building: ${l.buildingArea}`);
      if (l.availableNow) lines.push('  Available now');
      else if (l.availableFrom) lines.push(`  Available from ${l.availableFrom}`);
      if (l.bond) lines.push(`  Bond: ${l.bond}`);
      if (l.inspections?.length) lines.push(`  Inspections: ${l.inspections.join('; ')}`);
      if (l.soldDate) lines.push(`  Sold: ${l.soldDate}`);
      if (l.agents?.length) lines.push(`  Agent: ${l.agents.map((a) => a.name).join(', ')}`);
      if (section !== 'sold' && l.description) {
        const about = l.description.replace(/\s+/g, ' ').trim();
        lines.push(`  About: ${about.length > 500 ? `${about.slice(0, 500)}…` : about}`);
      }
      parts.push(lines.join('\n'));
    }
  }
  return `${parts.join('\n')}\n`;
}

const { source, files, photos, agentId } = await feedFiles();
const { listings, skipped, redirects } = parseFeed(files, { agentId });
const shortLinks = await resolveShortLinks(listings);

// Start empty each time, so photos of listings that have gone don't ship.
rmSync(PHOTO_DIR, { recursive: true, force: true });
mkdirSync(PHOTO_DIR, { recursive: true });
const copied = photos ? await useCopies(listings, photos) : 0;
const ogMade = await ogImages(listings);

// Always written, empty without a feed, so a build never picks up an
// earlier run's redirects.
mkdirSync(dirname(REDIRECTS_OUT), { recursive: true });
writeFileSync(REDIRECTS_OUT, `${JSON.stringify(redirects, null, 2)}\n`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(listings, null, 2)}\n`);
writeFileSync(
  CHAT_OUT,
  files.length
    ? chatListings(listings)
    : 'The listings feed is not connected on this build, so no listings are available here. Point visitors to /buy/ and /rent/.\n',
);

const count = (section) => listings.filter((l) => l.section === section).length;
console.log(
  `Listings: ${count('buy')} for sale, ${count('rent')} for rent, ${count('sold')} sold, ${count('commercial')} commercial, from ${files.length} file(s) (${source})`,
);
// Leased, withdrawn and off-market listings are skipped on purpose; the
// rest are worth a look in the build log.
for (const reason of skipped) console.log(`  skipped ${reason}`);
if (photos) console.log(`  ${copied} photo(s) and floor plan(s) from the feed server's copies`);
if (ogMade) console.log(`  ${ogMade} link-preview JPEG(s) of listings' main photos`);
if (redirects.length) console.log(`  ${redirects.length} redirect(s) for listing pages that have moved or gone`);
if (shortLinks) console.log(`  ${shortLinks} short link(s) in descriptions now link straight to where they go`);
