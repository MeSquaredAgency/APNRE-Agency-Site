// Business-wide details shown in the footer, privacy policy and call
// buttons. Keep these in one place so every page stays consistent.

export const BUSINESS_NAME = 'APN Real Estate';

/** Main line, used for every "Call" button. Both offices share it. */
export const PHONE_DISPLAY = '1300 123 276';
export const PHONE_TEL = 'tel:1300123276';
/** The same number for structured data. */
export const PHONE_SCHEMA = '+61-1300-123-276';

/** APN's WhatsApp Business number (+61 421 473 210): opens a chat. */
export const WHATSAPP_DISPLAY = '0421 473 210';
export const WHATSAPP_URL = 'https://wa.me/61421473210';

/** Both offices keep the same hours (confirmed 28 Sep 2026). If they
 *  change, update JSON_LD's openingHoursSpecification in
 *  scripts/build-pages.mjs and public/llms.txt too. */
export const OPENING_HOURS = {
  /** For the page, e.g. office cards and the footer. */
  display: 'Mon–Sat, 8:30am–5:00pm',
  /** For screen readers, which don't read "Mon–Sat" well. */
  spoken: 'Open Monday to Saturday, 8:30am to 5:00pm',
};

/** Legal entity details for the compliance line in the footer. Each one
 *  is only shown once it's filled in, so nothing half-finished goes live.
 *  Take these from the actual registration records rather than old
 *  signage: an SA agent has to show the RLA number that's current. */
export const LEGAL_ENTITY_NAME = '';
export const ABN = '';
export const ACN = '164 181 971';
export const RLA_NUMBER = '255336';

/** The licensee line SA requires on all marketing. The footer shows it on
 *  every page; public/404.html repeats it by hand. */
export const LICENSEE_LINE = `Adelaide Property Network | RLA ${RLA_NUMBER}`;

/** Where privacy requests go. Leave the email blank until there's a
 *  monitored inbox for it. The policy falls back to phone and post. */
export const PRIVACY_EMAIL = '';

/** APN's realestate.com.au agency profile. Every "browse listings" link
 *  goes here until the site has its own listings feed from the CRM. If
 *  Mount Gambier gets its own profile, add it to that office in
 *  offices.ts. */
export const REA_PROFILE_URL =
  'https://www.realestate.com.au/agency/adelaide-property-network-blair-athol-JIASZF';

export interface ExternalLink {
  label: string;
  /** Blank until APN supplies it; a blank link isn't shown. */
  href: string;
}

/** APN's agency pages on the four main portals, shown under the listings
 *  on /buy/ and /rent/. */
export const PORTALS: { residential: ExternalLink[]; commercial: ExternalLink[] } = {
  residential: [
    { label: 'realestate.com.au', href: REA_PROFILE_URL },
    // TODO(portal-urls): APN's agency profile on Domain.
    { label: 'Domain', href: '' },
    { label: 'realty.com.au', href: 'https://www.realty.com.au/agency/adelaide-property-network-5334' },
  ],
  commercial: [
    { label: 'realcommercial.com.au', href: 'https://www.realcommercial.com.au/agency/adelaide-property-network-blair-athol-JIASZF' },
    // TODO(portal-urls): APN's agency profile on commercialrealestate.com.au.
    { label: 'commercialrealestate.com.au', href: '' },
  ],
};

/** "Follow us" links, in the footer and under the listings. */
export const SOCIAL_LINKS: (ExternalLink & { icon: 'facebook' | 'instagram' | 'youtube' })[] = [
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/adelaidepropertynetwork' },
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/apn.realestate/' },
  { label: 'YouTube', icon: 'youtube', href: 'https://www.youtube.com/@AdelaidepropertynetworkAu' },
];

/** The tenant repairs form on /client-hub/. Leave this false until
 *  someone at APN is confirmed to check those submissions every business
 *  day. A repair request that sits unread in a sheet is worse than no
 *  form, so while it's false the page tells tenants to call instead. */
export const MAINTENANCE_FORM_ENABLED = false;
