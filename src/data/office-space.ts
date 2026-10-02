// The office space APN leases out on Level 1 of its own Blair Athol
// building (420B Main North Road), shown on /office-space/
// (src/pages/OfficeSpace.tsx). Facts and prices come from APN's
// commercialrealestate.com.au listing (17603774) and its floor plan,
// which is also served as-is at /office-space/floor-plan.jpg.
//
// This file is also read by functions/api/enquiry.ts, which checks
// booking requests against it, so it must stay plain data: no ?photo or
// other asset imports.
//
// When an office is leased or comes free, change its `status` here and
// redeploy. The floor plan, room list and booking form all follow.

/** Where the rooms are, for the address on each booking request. */
export const OFFICE_SPACE_ADDRESS = 'Level 1, 420B Main North Road, Blair Athol SA 5084';

/** Weekly rent for the cheapest office, including GST. */
export const OFFICE_RENT_FROM = 220;
/** Charged on top of rent, per week. */
export const CONSUMABLES_PER_WEEK = 30;
/** Printing is charged at cost, per page. */
export const PRINTING = { mono: '10c', colour: '20c' };

/** Lease terms a request can ask for. "Periodic 6 to 12+ months by
 *  negotiation" on the listing. Values are what the form sends;
 *  functions/api/enquiry.ts only accepts these. */
export const LEASE_TERMS = [
  { value: '6', label: '6 months' },
  { value: '9', label: '9 months' },
  { value: '12', label: '12 months' },
  { value: '12+', label: 'Longer than 12 months' },
] as const;

/** "How many people will use the office?" */
export const OFFICE_PEOPLE = ['1', '2', '3', '4 or more'] as const;

/* ---------- Podcast room (hired by the session) ---------- */

export type SessionLength = '2h' | 'half' | 'day';

/** Each length of hire and its price including GST, as set by APN
 *  (2 Oct 2026). `priceText` finishes "$175 …" in a sentence. */
export const PODCAST_LENGTHS: { id: SessionLength; label: string; rate: number; priceText: string }[] = [
  { id: '2h', label: '2 hours', rate: 120, priceText: 'for 2 hours' },
  { id: 'half', label: 'Half day', rate: 175, priceText: 'a half day' },
  { id: 'day', label: 'Full day', rate: 260, priceText: 'a full day' },
];

export type SessionId = 'am1' | 'am2' | 'pm1' | 'pm2' | 'am' | 'pm' | 'day';

export interface PodcastSession {
  id: SessionId;
  length: SessionLength;
  label: string;
  time: string;
  /** Minutes after midnight, Adelaide time: used to check the calendar. */
  start: number;
  end: number;
}

const at = (h: number, m = 0) => h * 60 + m;

/** Sessions sit inside office hours (Mon–Sat, 8:30am–5:00pm), when
 *  someone is at reception to let the hirer in. They overlap (a 2-hour
 *  slot is part of a half day), and the calendar check knows it: holding
 *  one blocks every session it overlaps. */
export const PODCAST_SESSIONS: PodcastSession[] = [
  { id: 'am1', length: '2h', label: 'Early morning', time: '8:30–10:30am', start: at(8, 30), end: at(10, 30) },
  { id: 'am2', length: '2h', label: 'Late morning', time: '10:30am–12:30pm', start: at(10, 30), end: at(12, 30) },
  { id: 'pm1', length: '2h', label: 'Early afternoon', time: '1:00–3:00pm', start: at(13), end: at(15) },
  { id: 'pm2', length: '2h', label: 'Late afternoon', time: '3:00–5:00pm', start: at(15), end: at(17) },
  { id: 'am', length: 'half', label: 'Morning', time: '8:30am–12:30pm', start: at(8, 30), end: at(12, 30) },
  { id: 'pm', length: 'half', label: 'Afternoon', time: '1:00–5:00pm', start: at(13), end: at(17) },
  { id: 'day', length: 'day', label: 'Full day', time: '8:30am–5:00pm', start: at(8, 30), end: at(17) },
];

/** What a session costs, including GST. */
export function sessionRate(session: PodcastSession): number {
  return PODCAST_LENGTHS.find((l) => l.id === session.length)!.rate;
}

/** "$120 for 2 hours, $175 a half day or $260 a full day". */
export const PODCAST_PRICES = PODCAST_LENGTHS.map((l) => `$${l.rate} ${l.priceText}`)
  .join(', ')
  .replace(/, ([^,]*)$/, ' or $1');

/** The room comes with recording kit (APN, 2 Oct 2026). */
export const PODCAST_KIT_INCLUDED = true;

/** The kit itself, item by item (mics, interface, headphones, acoustic
 *  panels…). Only listed once filled in, so the page never names
 *  equipment that isn't there. */
export const PODCAST_EQUIPMENT: string[] = [];

/** How far ahead the podcast room can be booked online. */
export const PODCAST_BOOKING_WEEKS = 10;

/* ---------- Rooms and the floor plan ---------- */

/** Plan units are pixels of the original drawing, measured from the
 *  building's top-left corner: about 43 units to the metre. Portrait,
 *  the same way up as the drawing. */
export type Shape = { rect: [x1: number, y1: number, x2: number, y2: number] } | { poly: [number, number][] };

/** 'service' is a room tenants don't use, like the storage room: drawn
 *  for orientation only. */
export type RoomUse = 'office' | 'podcast' | 'shared' | 'service';

export interface Room {
  id: string;
  /** Full name, e.g. "Office 5". Office numbers are ours, not the
   *  drawing's (it labels every office "Office 1"). */
  name: string;
  /** Used on the plan when the full name doesn't fit. */
  short: string;
  use: RoomUse;
  /** Offices only. Occupied offices are leased or used by APN. */
  status?: 'available' | 'occupied';
  /** ISO date, for an office that's leased now but comes free later. */
  availableFrom?: string;
  /** Width × depth in metres, as on the floor plan. Unset where the
   *  drawing doesn't give one ("0.0 x 0.0"). */
  size?: [number, number];
  /** Weekly rent including GST, once APN sets one for this room.
   *  Otherwise the page shows the "from" price. */
  weeklyRent?: number;
  plan: Shape;
  /** Where the label goes, for a polygon (rectangles are labelled in
   *  the middle). */
  labelAt?: [number, number];
}

// Neither drawing labels Offices 1–4. Their sizes are scaled off APN's
// Floorplanner plan (2 Oct 2026), calibrated against the rooms it does
// label: Offices 1–3 are the same size (APN confirmed), and are drawn
// equal here although both drawings show Office 3 shorter.
export const ROOMS: Room[] = [
  { id: 'office-1', name: 'Office 1', short: '1', use: 'office', status: 'available', size: [2.6, 3.9], plan: { rect: [0, 273, 117, 434] } },
  { id: 'office-2', name: 'Office 2', short: '2', use: 'office', status: 'available', size: [2.6, 3.9], plan: { rect: [0, 434, 117, 594] } },
  { id: 'office-3', name: 'Office 3', short: '3', use: 'office', status: 'available', size: [2.6, 3.9], plan: { rect: [0, 594, 117, 755] } },
  { id: 'office-4', name: 'Office 4', short: '4', use: 'office', status: 'available', size: [3.2, 5.6], plan: { rect: [195, 273, 340, 531] } },
  { id: 'office-5', name: 'Office 5', short: '5', use: 'office', status: 'available', size: [2.9, 5.6], plan: { rect: [340, 273, 473, 531] } },
  { id: 'office-6', name: 'Office 6', short: '6', use: 'office', status: 'available', size: [2.9, 3.6], plan: { rect: [340, 531, 473, 693] } },
  { id: 'office-7', name: 'Office 7', short: '7', use: 'office', status: 'available', size: [3.9, 5.9], plan: { rect: [537, 273, 717, 535] } },
  { id: 'office-8', name: 'Office 8', short: '8', use: 'office', status: 'occupied', size: [3.9, 5.9], plan: { rect: [537, 535, 717, 803] } },
  { id: 'office-9', name: 'Office 9', short: '9', use: 'office', status: 'occupied', size: [2.7, 3.9], plan: { rect: [0, 755, 127, 935] } },
  { id: 'office-10', name: 'Office 10', short: '10', use: 'office', status: 'occupied', size: [4.3, 2.9], plan: { rect: [127, 803, 323, 935] } },
  { id: 'office-11', name: 'Office 11', short: '11', use: 'office', status: 'occupied', size: [3.3, 2.9], plan: { rect: [323, 803, 473, 935] } },
  { id: 'office-12', name: 'Office 12', short: '12', use: 'office', status: 'occupied', size: [2.9, 3.4], plan: { rect: [340, 1095, 473, 1250] } },
  { id: 'office-13', name: 'Office 13', short: '13', use: 'office', status: 'occupied', size: [3.9, 2.3], plan: { rect: [537, 1073, 717, 1178] } },
  // Was an available office on the listing. Next to reception, so day
  // hirers don't walk past the tenants' offices.
  { id: 'podcast', name: 'Podcast Room', short: 'Podcast', use: 'podcast', size: [2.9, 3.5], plan: { rect: [340, 935, 473, 1095] } },
  { id: 'storage', name: 'Storage', short: 'Store', use: 'service', size: [3.7, 5.7], plan: { rect: [0, 0, 170, 245] } },
  { id: 'kitchen', name: 'Kitchen', short: 'Kitchen', use: 'shared', size: [4.9, 5.8], plan: { rect: [493, 0, 717, 273] } },
  { id: 'bathrooms', name: 'Bathrooms & shower', short: 'WC', use: 'shared', plan: { rect: [170, 0, 493, 225] } },
  { id: 'boardroom', name: 'Boardroom', short: 'Board', use: 'shared', size: [3.9, 5.9], plan: { rect: [537, 803, 717, 1073] } },
  {
    id: 'boardroom-2',
    name: 'Boardroom 2',
    short: 'Board 2',
    use: 'shared',
    labelAt: [250, 640],
    plan: {
      poly: [
        [117, 273],
        [195, 273],
        [195, 531],
        [340, 531],
        [340, 693],
        [473, 693],
        [473, 803],
        [127, 803],
        [127, 755],
        [117, 755],
      ],
    },
  },
  {
    id: 'reception',
    name: 'Reception & foyer',
    short: 'Reception',
    use: 'shared',
    labelAt: [528, 1440],
    plan: {
      poly: [
        [340, 1250],
        [537, 1250],
        [537, 1178],
        [717, 1178],
        [717, 1613],
        [340, 1613],
      ],
    },
  },
];

/** The building's outside walls, in plan units. */
export const PLAN_OUTLINE: [number, number][] = [
  [0, 0],
  [717, 0],
  [717, 1613],
  [340, 1613],
  [340, 935],
  [0, 935],
];
/** The front door, on the outside wall of the foyer. */
export const PLAN_ENTRY = { x: 717, y: 1465 };
/** The streets outside, for orientation: Main North Road runs past the
 *  foyer end (the bottom of the drawing), Barton Street down the side
 *  with the front door. */
export const PLAN_STREETS = { south: 'Main North Road', east: 'Barton Street' };
export const PLAN_SIZE = { width: 717, height: 1613 };

export const LEASABLE_OFFICES = ROOMS.filter((r) => r.use === 'office' && r.status === 'available');
/** The form's "not sure yet" choice (or, once every office is leased,
 *  "the next one to come free"), sent as the room. */
export const ANY_OFFICE = 'any';
export const PODCAST_ROOM = ROOMS.find((r) => r.use === 'podcast')!;

/** "2.9 × 5.6 m", or '' when the plan doesn't give a size. */
export function roomSize(room: Room): string {
  return room.size ? `${room.size[0]} × ${room.size[1]} m` : '';
}

/** "about 16 m²", or '' when unknown. */
export function roomArea(room: Room): string {
  return room.size ? `about ${Math.round(room.size[0] * room.size[1])} m²` : '';
}
