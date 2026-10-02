// Turns REAXML files (the format PropertyMe's listings feed uploads, one
// file per listing) into the listings the site shows: the Listing type in
// src/lib/listings.ts, which describes every field. Used by
// scripts/fetch-listings.mjs. See docs/listings-feed.md.
//
// REAXML is realestate.com.au's listing format. Each file is a
// <propertyList> holding one or more <residential>, <rental>, <land>,
// <rural> or <commercial> elements. Every update to a listing replaces
// its file, so the newest version of each uniqueID wins.
//
// Only what the feed says goes on the page: a hidden price stays hidden,
// a hidden street address shows the suburb only, and anything missing is
// left out rather than guessed.

import { XMLParser } from 'fast-xml-parser';

const LISTING_TYPES = ['residential', 'rental', 'land', 'rural', 'commercial'];
const REPEATED = new Set([...LISTING_TYPES, 'img', 'floorplan', 'listingAgent', 'telephone', 'inspection']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => REPEATED.has(name),
});

/** Text content of an element that may carry attributes. */
const text = (node) => {
  if (node == null) return '';
  if (typeof node === 'object') return String(node['#text'] ?? '').trim();
  return String(node).trim();
};
const attr = (node, name) => (node && typeof node === 'object' ? String(node[`@${name}`] ?? '').trim() : '');
const yes = (value) => ['yes', 'true', '1'].includes(String(value).toLowerCase());

const num = (node) => {
  const n = Number.parseFloat(text(node));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const money = (n) => `$${Math.round(n).toLocaleString('en-AU')}`;

/** "BLAIR ATHOL" → "Blair Athol". Leaves mixed case alone. */
function titleCase(s) {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** REAXML dates: "2026-10-02-14:30:00", "2026-10-02T14:30:00" or
 *  "20261002143000". Returned as "2026-10-02T14:30:00" (Adelaide time,
 *  as the feed gives it), or '' when unreadable. */
export function normaliseTime(value) {
  const s = String(value ?? '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[-T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) m = s.match(/^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2})(\d{2})?)?/);
  if (!m) return '';
  const [, y, mo, d, h = '00', mi = '00', se = '00'] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${se}`;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** The day an inspection ("21-Oct-2026 11:00am to 11:30am") is on, as
 *  "2026-10-21", or '' if it isn't in that format. */
function inspectionDay(s) {
  const m = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[a-z]*[- ](\d{4})/);
  if (!m || MONTHS[m[2].toLowerCase()] === undefined) return '';
  const month = String(MONTHS[m[2].toLowerCase()] + 1).padStart(2, '0');
  return `${m[3]}-${month}-${m[1].padStart(2, '0')}`;
}

/** "1/39" + "Main Road", or '' when the street address is hidden. */
function streetLine(address) {
  if (!address || attr(address, 'display') === 'no') return '';
  const number = [text(address.subNumber), text(address.streetNumber)].filter(Boolean).join('/');
  const lot = !number && text(address.lotNumber) ? `Lot ${text(address.lotNumber)}` : '';
  return [number || lot, titleCase(text(address.street))].filter(Boolean).join(' ');
}

function photos(objects) {
  const imgs = (objects?.img ?? [])
    .map((img) => ({ id: attr(img, 'id'), url: attr(img, 'url') }))
    // An <img> with no url is REAXML for "this photo was removed".
    .filter((img) => /^https?:\/\//i.test(img.url));
  // "m" is the main photo, then "a", "b", ... in order.
  imgs.sort((a, b) => (a.id === 'm' ? -1 : b.id === 'm' ? 1 : a.id.localeCompare(b.id, 'en', { numeric: true })));
  // Browsers upgrade http:// images on an https:// page anyway, so ask
  // for https:// straight away (docs/listings-feed.md: check the test feed).
  return imgs.map((img) => img.url.replace(/^http:\/\//i, 'https://'));
}

function floorplans(objects) {
  return (objects?.floorplan ?? [])
    .map((f) => attr(f, 'url'))
    .filter((url) => /^https?:\/\//i.test(url))
    .map((url) => url.replace(/^http:\/\//i, 'https://'));
}

function agents(node) {
  return (node.listingAgent ?? [])
    .map((a) => {
      const phones = a.telephone ?? [];
      const phone =
        text(phones.find((t) => attr(t, 'type') === 'mobile')) || text(phones.find((t) => attr(t, 'type') === 'BH'));
      return { name: text(a.name), ...(phone ? { phone } : {}), ...(text(a.email) ? { email: text(a.email) } : {}) };
    })
    .filter((a) => a.name);
}

/** What a sale listing shows as its price: the agent's own wording
 *  (priceView) first, the number only if they chose to show it. */
function salePrice(node) {
  const view = text(node.priceView);
  if (view) return view;
  if (attr(node.authority, 'value').toLowerCase() === 'auction') return 'Auction';
  const price = num(node.price);
  if (price && attr(node.price, 'display') !== 'no') return money(price);
  return 'Contact agent';
}

function rentPrice(node, rentEl) {
  const view = text(node.priceView);
  if (view) return view;
  const rent = num(rentEl);
  if (rent && attr(rentEl, 'display') !== 'no') {
    const period = attr(rentEl, 'period') || 'week';
    return `${money(rent)} per ${period === 'annual' ? 'year' : period === 'monthly' ? 'month' : period}`;
  }
  return 'Contact agent';
}

function soldPrice(node) {
  const sold = node.soldDetails;
  const price = sold && (num(sold.soldPrice) ?? num(sold.price));
  const shown = sold && attr(sold.soldPrice ?? sold.price, 'display') !== 'no';
  return price && shown ? `Sold for ${money(price)}` : 'Sold';
}

function area(node) {
  const n = num(node);
  if (!n) return undefined;
  const unit = attr(node, 'unit');
  const label =
    { squareMeter: 'm²', squareMeters: 'm²', hectare: 'ha', acre: 'acres', square: 'squares' }[unit] ?? 'm²';
  return `${n.toLocaleString('en-AU')} ${label}`;
}

function category(type, node) {
  const name =
    attr(node.category, 'name') ||
    attr(node.landCategory, 'name') ||
    attr(node.ruralCategory, 'name') ||
    attr(Array.isArray(node.commercialCategory) ? node.commercialCategory[0] : node.commercialCategory, 'name');
  if (name) return name.replace(/([a-z])([A-Z])/g, '$1 $2');
  return { land: 'Land', rural: 'Rural', commercial: 'Commercial' }[type] ?? 'Property';
}

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** One listing element → a Listing, or null when it isn't shown on the
 *  site (withdrawn, off market, leased, or missing the essentials). */
function toListing(type, node, agentId) {
  const id = text(node.uniqueID);
  const status = (attr(node, 'status') || 'current').toLowerCase();
  if (!id) return { skip: 'no uniqueID' };
  if (agentId && text(node.agentID) && text(node.agentID) !== agentId) {
    return { skip: `agentID ${text(node.agentID)} is not ours (${agentId})` };
  }

  const commercialType = attr(node.commercialListingType, 'value').toLowerCase();
  const forRent = type === 'rental' || (type === 'commercial' && commercialType === 'lease');
  let section;
  if (status === 'current') section = forRent ? 'rent' : 'buy';
  else if (status === 'sold' && !forRent) section = 'sold';
  else return { skip: `status ${status}` };

  const address = node.address ?? {};
  const suburbHidden = attr(address.suburb, 'display') === 'no';
  const suburb = suburbHidden ? '' : titleCase(text(address.suburb));
  const street = streetLine(address);
  const state = text(address.state).toUpperCase();
  const postcode = text(address.postcode);
  if (!suburb && !street) return { skip: 'no address to show' };

  const features = node.features ?? {};
  const land = node.landDetails ?? {};
  const building = node.buildingDetails ?? {};
  const carSpaces = (num(features.garages) ?? 0) + (num(features.carports) ?? 0) + (num(features.openSpaces) ?? 0);
  const rentEl = type === 'commercial' ? node.commercialRent : node.rent;
  const today = new Date().toISOString().slice(0, 10);
  const inspections = (node.inspectionTimes?.inspection ?? [])
    .map(text)
    .filter(Boolean)
    // Past inspections drop off at the next build (the feed server
    // triggers one each night).
    .filter((s) => !inspectionDay(s) || inspectionDay(s) >= today);
  const modified = normaliseTime(attr(node, 'modTime'));
  const soldDate = section === 'sold' ? normaliseTime(text(node.soldDetails?.soldDate ?? node.soldDetails?.date)).slice(0, 10) : '';

  const pathSlug = slugify([street, suburb, id].filter(Boolean).join(' '));
  const listing = {
    id,
    section,
    path: `/${section}/${pathSlug}/`,
    category: category(type, node),
    headline: text(node.headline),
    description: text(node.description),
    street,
    suburb,
    state,
    postcode,
    price: section === 'sold' ? soldPrice(node) : forRent ? rentPrice(node, rentEl) : salePrice(node),
    underOffer: section === 'buy' && yes(attr(node.underOffer, 'value')),
    bedrooms: num(features.bedrooms),
    bathrooms: num(features.bathrooms),
    carSpaces: carSpaces || undefined,
    landArea: area(land.area),
    buildingArea: area(building.area),
    photos: photos(node.objects),
    floorplans: floorplans(node.objects),
    inspections,
    availableFrom: forRent ? normaliseTime(text(node.dateAvailable)).slice(0, 10) || undefined : undefined,
    bond: forRent && num(node.bond) ? money(num(node.bond)) : undefined,
    agents: agents(node),
    soldDate: soldDate || undefined,
    modified,
  };
  // Drop empty fields so the JSON (shipped to the browser) stays small.
  for (const [key, value] of Object.entries(listing)) {
    if (value === undefined || value === '' || value === false || (Array.isArray(value) && value.length === 0)) {
      delete listing[key];
    }
  }
  return { listing };
}

/**
 * Parses REAXML files into listings.
 * @param {{ name: string, xml: string }[]} files
 * @param {{ agentId?: string, maxSold?: number }} options
 *   agentId: when set, listings for any other agency are skipped.
 *   maxSold: how many recent sales /sold/ shows.
 * @returns {{ listings: object[], skipped: string[] }}
 */
export function parseFeed(files, { agentId, maxSold = 24 } = {}) {
  /** Newest version of each listing, by uniqueID. */
  const latest = new Map();
  const skipped = [];
  for (const file of files) {
    let doc;
    try {
      doc = parser.parse(file.xml);
    } catch (err) {
      skipped.push(`${file.name}: not valid XML (${err.message})`);
      continue;
    }
    const list = doc.propertyList;
    if (!list) {
      skipped.push(`${file.name}: no <propertyList>`);
      continue;
    }
    for (const type of LISTING_TYPES) {
      for (const node of list[type] ?? []) {
        const id = text(node.uniqueID);
        const modified = normaliseTime(attr(node, 'modTime'));
        const prev = latest.get(id);
        if (prev && prev.modified > modified) continue;
        latest.set(id, { type, node, modified, file: file.name });
      }
    }
  }

  const listings = [];
  const usedPaths = new Set();
  for (const { type, node, file } of latest.values()) {
    const result = toListing(type, node, agentId);
    if (!result.listing) {
      skipped.push(`${file} (${text(node.uniqueID) || 'no id'}): ${result.skip}`);
      continue;
    }
    if (usedPaths.has(result.listing.path)) {
      skipped.push(`${file}: duplicate path ${result.listing.path}`);
      continue;
    }
    usedPaths.add(result.listing.path);
    listings.push(result.listing);
  }

  // Newest first: sold by sale date, the rest by last update.
  const key = (l) => (l.section === 'sold' ? (l.soldDate ?? l.modified ?? '') : (l.modified ?? ''));
  listings.sort((a, b) => key(b).localeCompare(key(a)));
  const sold = listings.filter((l) => l.section === 'sold').slice(0, maxSold);
  return { listings: [...listings.filter((l) => l.section !== 'sold'), ...sold], skipped };
}
