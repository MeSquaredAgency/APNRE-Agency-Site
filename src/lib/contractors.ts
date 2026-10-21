// The preferred contractors on /client-hub/contractors/, from
// src/data/contractors.json. The page is only built once `published` is
// true (scripts/routes.mjs), and its menu link only shows then too. See
// docs/preferred-contractors.md, including the referral-fee disclosure
// that has to be in place first.

import data from '../data/contractors.json';
import type { OfficeId } from '../data/offices';

export interface Contractor {
  name: string;
  /** e.g. "Plumbing". The page's Trade drop-down lists each one used. */
  trade: string;
  /** The offices whose areas they cover. */
  areas: OfficeId[];
  phone?: string;
  email?: string;
  /** Full https:// address. */
  website?: string;
  /** What they pay APN Real Estate for each job referred, worded as it
   *  should be shown, e.g. "$20 per job". Leave it out when they pay
   *  nothing. Every fee must be listed: it's how the page discloses them. */
  referralFee?: string;
  /** A short line about what they do, if useful. */
  note?: string;
}

export const CONTRACTORS_PUBLISHED: boolean = data.published;
export const CONTRACTORS = data.contractors as Contractor[];

/** Each trade once, A–Z, for the drop-down. */
export const TRADES = [...new Set(CONTRACTORS.map((c) => c.trade))].sort((a, b) => a.localeCompare(b));
