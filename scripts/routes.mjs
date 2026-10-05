// Every page the site builds: the fixed pages in src/data/routes.json
// plus one per listing in src/data/listings.json (written by
// scripts/fetch-listings.mjs). Shared by scripts/build-pages.mjs,
// scripts/prerender.mjs and vite.config.ts, so all three agree on the
// list.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SECTION_LABEL = { buy: 'For Sale', rent: 'For Rent', sold: 'Sold' };
const SITE = 'https://apnre.com.au';

/** Feed photos can be paths on this site (/listing-photo/...); link
 *  previews need a full URL. */
const absolute = (url) => (url.startsWith('/') ? SITE + url : url);

/** The listing's address as one line, e.g. "2/14 Smith Street, Blair Athol". */
export const listingAddress = (l) => [l.street, l.suburb].filter(Boolean).join(', ');

function clip(s, max) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
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
    description: clip(l.headline ? `${l.headline}. ${summary}.` : `${summary}.`, 160),
    // The main photo is the link preview, hosted wherever the feed's
    // photos are (scripts/build-pages.mjs).
    ...(l.photos?.[0] ? { ogImage: absolute(l.photos[0]), ogAlt: `${address}: main photo` } : {}),
    lastmod: (l.modified || l.soldDate || '').slice(0, 10) || undefined,
  };
}

export function loadListings() {
  const file = join(ROOT, 'src/data/listings.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
}

export function allRoutes() {
  const routes = JSON.parse(readFileSync(join(ROOT, 'src/data/routes.json'), 'utf8'));
  const listings = loadListings();
  // /buy/, /rent/ and /sold/ change whenever one of their listings does,
  // so their sitemap <lastmod> is the newest listing's.
  const newest = (section) =>
    listings
      .filter((l) => l.section === section)
      .map((l) => (l.modified || '').slice(0, 10))
      .sort()
      .pop();
  const fixed = routes.map((r) => (newest(r.page) ? { ...r, lastmod: newest(r.page) } : r));
  return [...fixed, ...listings.map(listingRoute)];
}
