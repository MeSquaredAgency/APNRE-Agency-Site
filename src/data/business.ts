// Business-wide details shown in the footer, privacy policy and call
// buttons. Keep these in one place so every page stays consistent.

export const BUSINESS_NAME = 'APN Real Estate';

/** Main line, used for every "Call" button. Both offices share it. */
export const PHONE_DISPLAY = '1300 123 276';
export const PHONE_TEL = 'tel:1300123276';

/** Legal entity details for the compliance line in the footer. Each one
 *  is only shown once it's filled in, so nothing half-finished goes live.
 *  Take these from the actual registration records rather than old
 *  signage: an SA agent has to show the RLA number that's current. */
export const LEGAL_ENTITY_NAME = '';
export const ABN = '';
export const ACN = '164 181 971';
export const RLA_NUMBER = '255336';

/** Where privacy requests go. Leave the email blank until there's a
 *  monitored inbox for it. The policy falls back to phone and post. */
export const PRIVACY_EMAIL = '';

/** APN's realestate.com.au agency profile. Every "browse listings" link
 *  goes here until the site has its own listings feed from the CRM. If
 *  Mount Gambier gets its own profile, add it to that office in
 *  offices.ts. */
export const REA_PROFILE_URL =
  'https://www.realestate.com.au/agency/adelaide-property-network-blair-athol-JIASZF';

/** The tenant repairs form on /maintenance/. Leave this false until
 *  someone at APN is confirmed to check those submissions every business
 *  day. A repair request that sits unread in a sheet is worse than no
 *  form, so while it's false the page tells tenants to call instead. */
export const MAINTENANCE_FORM_ENABLED = false;
