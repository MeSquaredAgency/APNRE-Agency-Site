// Every page the site builds: the fixed pages in src/data/routes.json
// plus one per listing in src/data/listings.json (written by
// scripts/fetch-listings.mjs). Shared by scripts/build-pages.mjs,
// scripts/prerender.mjs and vite.config.ts, so all three agree on the
// list.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SECTION_LABEL = { buy: 'For Sale', rent: 'For Rent', sold: 'Sold', commercial: 'For Lease' };
const SITE = 'https://apnre.com.au';
/** The listings pages, each showing the listings with that `section`. */
const LISTING_SECTIONS = Object.keys(SECTION_LABEL);

/** Feed photos can be paths on this site (/listing-photo/...); link
 *  previews need a full URL. */
const absolute = (url) => (url.startsWith('/') ? SITE + url : url);

/** The listing's address as one line, e.g. "2/14 Smith Street, Blair Athol". */
export const listingAddress = (l) => [l.street, l.suburb].filter(Boolean).join(', ');

function clip(s, max) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/** Under this, a meta description says too little to fill a search
 *  result (Ahrefs flags "Meta description too short" below 110). */
const MIN_DESCRIPTION = 110;

/** The listing's own opening words, for padding out a short meta
 *  description: its first line that reads like a sentence (not a
 *  heading such as "Property Features:", not the headline again). */
function openingLine(l) {
  const lines = (l.description || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-–—•*·]+\s*/, '').replace(/\s+/g, ' ').trim());
  return lines.find((line) => line.length >= 40 && !/:$/.test(line) && line !== l.headline);
}

function listingDescription(l, summary) {
  // No full stop after a headline that already ends in one ("…beyond!").
  const headline = l.headline && (/[.!?]$/.test(l.headline) ? l.headline : `${l.headline}.`);
  let text = headline ? `${headline} ${summary}.` : `${summary}.`;
  if (text.length < MIN_DESCRIPTION) {
    const opening = openingLine(l);
    text += opening ? ` ${opening}` : ' See the photos, inspection times and agent details at APN Real Estate.';
  }
  return clip(text, 160);
}

/** The main photo's sizes attribute: the full width of the page's
 *  .wrap (100vw less its gutters, clamp(16px, 4.5vw, 64px) each side, in
 *  src/index.css), up to 1232px. Must match MAIN_PHOTO_SIZES in
 *  src/lib/listings.ts, or the preload and the <img> fetch different
 *  files. */
const MAIN_PHOTO_SIZES = '(min-width: 1360px) 1232px, 92vw';

/** The <img> the listing page starts with (Photos in src/pages/Listing.tsx):
 *  the same srcset as mainPhotoSrcSet in src/lib/listings.ts. */
function mainPhotoPreload(l) {
  const big = l.photos[0];
  const small = l.thumbs?.[0];
  const set =
    small && small !== big
      ? [`${small} 800w`, l.mainPhoto1200 && `${l.mainPhoto1200} 1200w`, `${big} 1600w`].filter(Boolean).join(', ')
      : undefined;
  return { href: big, srcset: set, sizes: set ? MAIN_PHOTO_SIZES : undefined };
}

function listingRoute(l) {
  const address = listingAddress(l);
  const rooms = [
    l.bedrooms && `${l.bedrooms} bed`,
    l.bathrooms && `${l.bathrooms} bath`,
    l.carSpaces && `${l.carSpaces} car`,
  ].filter(Boolean);
  const summary = [`${l.category} ${SECTION_LABEL[l.section].toLowerCase()} in ${l.suburb || address}`, rooms.join(', '), l.price]
    .filter(Boolean)
    .join(' · ');
  return {
    page: 'listing',
    path: l.path,
    title: `${address} | ${SECTION_LABEL[l.section]} | APN Real Estate`,
    description: listingDescription(l, summary),
    // The main photo is the link preview: the 1200 x 630 JPEG of it
    // (scripts/fetch-listings.mjs), since some apps don't show WebP
    // previews, or the photo itself where that couldn't be made.
    ...(l.photos?.[0]
      ? {
          ogImage: absolute(l.ogImage ?? l.photos[0]),
          ogImageSized: Boolean(l.ogImage),
          ogAlt: `${address}: main photo`,
        }
      : {}),
    // The main photo is the page's largest image, so the head preloads it
    // (scripts/build-pages.mjs) rather than leaving it until the page's
    // markup is read.
    ...(l.photos?.[0] ? { preloadImage: mainPhotoPreload(l) } : {}),
    lastmod: (l.modified || l.soldDate || '').slice(0, 10) || undefined,
  };
}

export function loadListings() {
  const file = join(ROOT, 'src/data/listings.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
}

/** /client-hub/contractors/ is only built once src/data/contractors.json
 *  is marked published (docs/preferred-contractors.md). */
function contractorsPublished() {
  return JSON.parse(readFileSync(join(ROOT, 'src/data/contractors.json'), 'utf8')).published === true;
}

export function allRoutes() {
  const routes = JSON.parse(readFileSync(join(ROOT, 'src/data/routes.json'), 'utf8')).filter(
    (r) => r.page !== 'contractors' || contractorsPublished(),
  );
  const listings = loadListings();
  // /rent/ shows commercial leases too (src/pages/Listings.tsx).
  const shownOn = (page) => (page === 'rent' ? ['rent', 'commercial'] : [page]);
  // /buy/, /rent/ and /sold/ change whenever one of their listings does,
  // so their sitemap <lastmod> is the newest listing's.
  const newest = (page) =>
    listings
      .filter((l) => shownOn(page).includes(l.section))
      .map((l) => (l.modified || '').slice(0, 10))
      .sort()
      .pop();
  // An empty /buy/, /rent/, /sold/ or /commercial/ is only a pointer to
  // realestate.com.au or a "Nothing listed right now" panel, which Google
  // reports as a soft 404. So it's noindex, and out of the sitemap, until
  // the feed brings it a listing (each feed change rebuilds the site).
  const isEmptySection = (page) =>
    LISTING_SECTIONS.includes(page) && !listings.some((l) => shownOn(page).includes(l.section));
  const fixed = routes.map((r) => ({
    ...r,
    ...(newest(r.page) ? { lastmod: newest(r.page) } : {}),
    ...(isEmptySection(r.page) ? { noindex: true } : {}),
  }));
  // Blair Athol's offices are on /office-space/, not pages of their own.
  return [...fixed, ...listings.filter((l) => l.apnBuilding !== 'blair-athol').map(listingRoute)];
}
