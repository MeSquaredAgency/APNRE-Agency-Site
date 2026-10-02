// The listings from PropertyMe's feed, as scripts/fetch-listings.mjs
// writes them to src/data/listings.json at build time (scripts/reaxml.mjs
// does the conversion). Empty until the feed is set up, and then /buy/,
// /rent/ and /sold/ fall back to linking to realestate.com.au. See
// docs/listings-feed.md.

import data from '../data/listings.json';

export type ListingSection = 'buy' | 'rent' | 'sold';

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
  headline?: string;
  /** Plain text: blank lines between paragraphs. */
  description?: string;
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
  /** Main photo first. Hosted by PropertyMe. */
  photos?: string[];
  floorplans?: string[];
  /** As the feed words them, e.g. "11-Oct-2026 10:00am to 10:15am".
   *  Past ones are dropped at build time. */
  inspections?: string[];
  /** Rentals: YYYY-MM-DD. */
  availableFrom?: string;
  bond?: string;
  agents?: ListingAgent[];
  /** Sold listings: YYYY-MM-DD. */
  soldDate?: string;
  /** Last change in PropertyMe, YYYY-MM-DDTHH:MM:SS (Adelaide time). */
  modified?: string;
}

export const LISTINGS = data as unknown as Listing[];

export const listingsIn = (section: ListingSection) => LISTINGS.filter((l) => l.section === section);

/** "2/14 Smith Street, Blair Athol", or just the suburb when the street
 *  is hidden. Matches listingAddress in scripts/routes.mjs. */
export const listingAddress = (l: Listing) => [l.street, l.suburb].filter(Boolean).join(', ');

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
