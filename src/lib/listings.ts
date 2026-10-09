// The listings from PropertyMe's feed, as scripts/fetch-listings.mjs
// writes them to src/data/listings.json at build time (scripts/reaxml.mjs
// does the conversion). Empty until the feed is set up, and then /buy/,
// /rent/ and /sold/ fall back to linking to realestate.com.au. See
// docs/listings-feed.md.

import data from '../data/listings.json';

/** 'commercial': a lease that isn't a home (PropertyMe's "Offices",
 *  "Retail", "Other"...), shown on /commercial/ rather than /rent/. */
export type ListingSection = 'buy' | 'rent' | 'sold' | 'commercial';

export interface ListingAgent {
  name: string;
  phone?: string;
  email?: string;
}

/** Optional fields are left out when the feed doesn't have them. */
export interface Listing {
  /** PropertyMe's uniqueID. */
  id: string;
  section: ListingSection;
  /** The listing's own page, e.g. /rent/2-14-smith-street-blair-athol-l123/. */
  path: string;
  /** "House", "Unit", "Land", ... */
  category: string;
  /** From the listing type and category (scripts/reaxml.mjs): drives the
   *  Residential / Commercial filter on /buy/. */
  propertyType?: 'residential' | 'commercial';
  headline?: string;
  /** Plain text: blank lines between paragraphs. */
  description?: string;
  /** Where the description's short links (goo.gl/..., youtu.be/...) go,
   *  looked up at build time (scripts/fetch-listings.mjs) so the page
   *  links there directly instead of through a redirect. */
  linkTargets?: Record<string, string>;
  /** Missing when the agent has hidden the street address. */
  street?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  /** Ready to show: the agent's own wording ("Offers over $640,000",
   *  "$520 per week"), "Contact agent", or "Sold for $601,000". */
  price: string;
  underOffer?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  landArea?: string;
  buildingArea?: string;
  /** Main photo first, up to 1600px wide. PropertyMe's are paths on this
   *  site: /listing-photos/... (the feed server's WebP copies), or
   *  /listing-photo/... (fetched from PropertyMe by
   *  functions/listing-photo/[file].ts) until a copy exists. Any others
   *  are full https:// URLs. */
  photos?: string[];
  /** The same photos, in the same order, at up to 800px for cards and
   *  thumbnails (the same file as `photos` where there's no smaller copy). */
  thumbs?: string[];
  floorplans?: string[];
  /** As the feed words them, e.g. "11-Oct-2026 10:00am to 10:15am".
   *  Past ones are dropped at build time. */
  inspections?: string[];
  /** Rentals: YYYY-MM-DD, when that's still to come. */
  availableFrom?: string;
  /** Rentals whose available date had passed when the site was built
   *  (rebuilt each night), shown as "Available now". */
  availableNow?: boolean;
  bond?: string;
  agents?: ListingAgent[];
  /** Sold listings: YYYY-MM-DD. */
  soldDate?: string;
  /** Commercial space in one of APN's own office buildings. Blair Athol's
   *  offices are shown on /office-space/ and have no page of their own;
   *  their cards link there. */
  apnBuilding?: 'blair-athol' | 'mount-gambier';
  /** Last change in PropertyMe, YYYY-MM-DDTHH:MM:SS (PropertyMe sends UTC). */
  modified?: string;
}

export const LISTINGS = data as unknown as Listing[];

export const listingsIn = (section: ListingSection) => LISTINGS.filter((l) => l.section === section);

/** Photo `i` for a card or thumbnail: the 800px copy where there is one. */
export const thumb = (l: Listing, i: number) => l.thumbs?.[i] ?? l.photos?.[i];

/** srcset for photo `i` shown large: both sizes, so phones load the 800px
 *  copy. Undefined when there's only one size. */
export function photoSrcSet(l: Listing, i: number): string | undefined {
  const big = l.photos?.[i];
  const small = l.thumbs?.[i];
  return big && small && small !== big ? `${small} 800w, ${big} 1600w` : undefined;
}

/** "2/14 Smith Street, Blair Athol", or just the suburb when the street
 *  is hidden. Matches listingAddress in scripts/routes.mjs. */
export const listingAddress = (l: Listing) => [l.street, l.suburb].filter(Boolean).join(', ');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** An inspection as the feed words it ("11-Oct-2026 2:00pm to 2:30pm")
 *  → "Sat 11 October, 2:00pm – 2:30pm". Left as-is if it's in some other
 *  format. */
export function formatInspection(s: string): string {
  const m = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[a-z]*[- ](\d{4})\s+(.+?)(?:\s+to\s+|\s*[-–]\s*)(.+)$/);
  const month = m ? MONTHS_SHORT.indexOf(m[2].toLowerCase()) : -1;
  if (!m || month < 0) return s;
  const [, d, , y, from, to] = m;
  // UTC, so the weekday doesn't depend on the build machine's time zone.
  const weekday = DAYS[new Date(Date.UTC(Number(y), month, Number(d))).getUTCDay()];
  return `${weekday} ${formatDay(`${y}-${month + 1}-${d}`).replace(/ \d{4}$/, '')}, ${from} – ${to}`;
}

/** "20 October 2026" from YYYY-MM-DD, without going through Date (and
 *  the build machine's time zone). */
export function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const month = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][m - 1];
  return month ? `${d} ${month} ${y}` : day;
}
