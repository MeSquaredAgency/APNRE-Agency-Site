import balconyView from '../../assets/photos/balcony-view-hills.jpg?photo';
import mountGambierStreet from '../../assets/photos/mount-gambier-hillside-street.jpg?photo';
import adelaideLogo from '../../assets/logo/adelaide-property-network-logo.png';
import mountGambierLogo from '../../assets/logo/mount-gambier-property-network-logo.png';
import type { Photo } from '../../lib/photo';

/** A logo file and its size in pixels. Update the size if the file is
 *  replaced, so the browser reserves the right space for it. */
export interface Logo {
  src: string;
  width: number;
  height: number;
}

/** The main brand logo, used on the homepage and the Adelaide page. */
export const MAIN_LOGO: Logo = { src: adelaideLogo, width: 362, height: 240 };
export const MAIN_LOGO_ALT = 'Adelaide Property Network — APN Real Estate';

export type OfficeId = 'adelaide' | 'mount-gambier';

/** A real client testimonial. Only add these with the client's OK and
 *  exactly as they said/wrote it — never paraphrase into something they
 *  didn't say, and never invent one. */
export interface SuccessStory {
  quote: string;
  /** How the client is named on the page, e.g. 'Sarah T., landlord'. */
  attribution: string;
  suburb?: string;
  /** Where it came from, e.g. 'realestate.com.au review' — optional, but
   *  a linkable source makes a testimonial far more credible. */
  sourceLabel?: string;
  sourceUrl?: string;
}

/** A real property APN has worked on. The photo must be of that actual
 *  property (import it from src/assets/photos/ with ?photo on the end).
 *  Keep captions factual:
 *  what happened, not how impressive it was. */
export interface WorkExample {
  photo: Photo;
  alt: string;
  /** Short label, e.g. street + suburb: 'Fenden Road, Salisbury'. */
  title: string;
  /** One or two plain sentences, e.g. 'Leased within two weeks of
   *  listing after a pre-lease maintenance round.' Only verified facts. */
  description?: string;
  /** e.g. 'Leased', 'Managed', 'Sold'. */
  tag?: string;
}

export interface Office {
  id: OfficeId;
  name: string;
  /** Where this office's links go. The separate office pages became the
   *  offices on the main site's contact page when the landing page moved
   *  into it (old URLs redirect there; see public/_redirects). */
  path: string;
  /** Logo shown in the header on this office's page. Adelaide uses the
   *  main logo; Mount Gambier has its own version of it. */
  logo: Logo;
  logoAlt: string;
  addressLines: [string, string];
  /** The same address split up for structured data (see
   *  src/structured-data.ts). Keep it in step with addressLines. */
  postalAddress: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
  };
  phone: string;
  /** Must be a real photo from this area. Leave unset to show a plain
   *  dark hero rather than borrowing another office's photography. */
  heroPhoto?: Photo;
  heroAlt?: string;
  /** CSS object-position for the hero image. */
  heroFocalPoint?: string;
  lede: string;
  /** The office "bio" — a few short paragraphs. Keep it to facts APN has
   *  confirmed: who works there, where it is, what it does. */
  about: string[];
  reviewsUrl: string;
  /** Both lists are hidden on the page while empty, so nothing
   *  placeholder-y ever goes live. Add real entries to make each
   *  section appear. */
  successStories: SuccessStory[];
  workExamples: WorkExample[];
}

// APN's realestate.com.au agency profile (also used in Proof.tsx). If
// Mount Gambier has its own profile, swap its reviewsUrl for that one.
const REA_PROFILE_URL = 'https://www.realestate.com.au/agency/adelaide-property-network-blair-athol-JIASZF';

export const OFFICES: Record<OfficeId, Office> = {
  adelaide: {
    id: 'adelaide',
    name: 'Adelaide',
    path: '/contact/#adelaide',
    logo: MAIN_LOGO,
    logoAlt: MAIN_LOGO_ALT,
    addressLines: ['Level 1 / 420B, Cnr Main North Road', 'and Barton Street, Blair Athol SA 5084'],
    postalAddress: {
      streetAddress: 'Level 1 / 420B, Cnr Main North Road and Barton Street',
      addressLocality: 'Blair Athol',
      postalCode: '5084',
    },
    phone: '1300 123 276',
    heroPhoto: balconyView,
    heroAlt: 'View across the Adelaide hills from one of the properties APN manages',
    heroFocalPoint: 'center 78%',
    lede: 'Property management for Adelaide landlords from our Blair Athol office — with a named property manager you can reach directly.',
    about: [
      'APN Real Estate began in Adelaide as Adelaide Property Network, founded by Patrick Nhim. Our Adelaide office is in Blair Athol, on the corner of Main North Road and Barton Street.',
      'It’s home to Patrick, who leads the sales team, Brett David, who heads up leasing and accounts, and property manager Marissa Bowell — so property management and sales work side by side, with a day-to-day view of the Adelaide market.',
    ],
    reviewsUrl: REA_PROFILE_URL,
    successStories: [],
    workExamples: [],
  },
  'mount-gambier': {
    id: 'mount-gambier',
    name: 'Mount Gambier',
    path: '/contact/#mount-gambier',
    logo: { src: mountGambierLogo, width: 369, height: 240 },
    logoAlt: 'Mount Gambier Property Network — APN Real Estate',
    addressLines: ['178 Commercial Street East,', 'Mount Gambier SA 5290'],
    postalAddress: {
      streetAddress: '178 Commercial Street East',
      addressLocality: 'Mount Gambier',
      postalCode: '5290',
    },
    phone: '1300 123 276',
    // A Mount Gambier street from APN's own listing photography (a sales
    // listing, so the alt text doesn't claim APN manages it).
    heroPhoto: mountGambierStreet,
    heroAlt: 'Homes on a hillside street in Mount Gambier',
    heroFocalPoint: '30% 65%',
    lede: 'Property management for Mount Gambier landlords from a local team on Commercial Street East — with a named property manager you can reach directly.',
    about: [
      'Our Mount Gambier office is at 178 Commercial Street East, with a local team looking after Mount Gambier landlords and their properties.',
      'Property managers Luke Whittaker and Jenny Saffin manage the office’s rentals, with Breeanna Arney joining them as a property management trainee — so when you call or walk in, you’re dealing with people who work in the local market every day.',
    ],
    reviewsUrl: REA_PROFILE_URL,
    successStories: [],
    workExamples: [],
  },
};

export const OFFICE_LIST: Office[] = [OFFICES.adelaide, OFFICES['mount-gambier']];
