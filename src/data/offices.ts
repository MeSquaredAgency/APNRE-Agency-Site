import type { Photo } from '../lib/photo';
import mountGambierStreet from '../assets/photos/mount-gambier-hillside-street.jpg?photo';
// The Blair Athol office, from APN's own listing of its spare office space
// (Mount Gambier Property Network, commercialrealestate.com.au listing
// 17603774). They carry the Adelaide Property Network watermark.
import blairAtholFrontage from '../assets/photos/office/blair-athol-frontage.jpg?photo';
import blairAtholReception from '../assets/photos/office/blair-athol-reception.jpg?photo';
import blairAtholMeetingRoom from '../assets/photos/office/blair-athol-meeting-room.jpg?photo';
import blairAtholBoardroom from '../assets/photos/office/blair-athol-boardroom.jpg?photo';
import blairAtholLounge from '../assets/photos/office/blair-athol-lounge.jpg?photo';
import blairAtholHallway from '../assets/photos/office/blair-athol-hallway.jpg?photo';
import adelaideLogo from '../assets/logo/adelaide-property-network-logo.png';
import mountGambierLogo from '../assets/logo/mount-gambier-property-network-logo.png';

/** The main brand logo, used in the header on every page. */
export const MAIN_LOGO = adelaideLogo;
export const MAIN_LOGO_ALT = 'Adelaide Property Network — APN Real Estate';

export type OfficeId = 'adelaide' | 'mount-gambier';

export interface Office {
  id: OfficeId;
  name: string;
  logo: string;
  logoAlt: string;
  addressLines: [string, string];
  /** For a "Get directions" link. */
  mapsQuery: string;
  phone: string;
  /** Must be a real photo from this area. */
  photo: Photo;
  photoAlt: string;
  /** Facts APN has confirmed: who works there, where it is, what it does. */
  about: string;
}

export const OFFICES: Record<OfficeId, Office> = {
  adelaide: {
    id: 'adelaide',
    name: 'Adelaide',
    logo: adelaideLogo,
    logoAlt: MAIN_LOGO_ALT,
    addressLines: ['Level 1 / 420B, Cnr Main North Road', 'and Barton Street, Blair Athol SA 5084'],
    mapsQuery: '420B Main North Road, Blair Athol SA 5084',
    phone: '1300 123 276',
    photo: blairAtholFrontage,
    photoAlt: 'The Adelaide Property Network office at 420 Main North Road, Blair Athol, with its signage out the front',
    about:
      'Our Blair Athol office, on the corner of Main North Road and Barton Street, is home to the sales team, leasing and accounts, and Adelaide property management.',
  },
  'mount-gambier': {
    id: 'mount-gambier',
    name: 'Mount Gambier',
    logo: mountGambierLogo,
    logoAlt: 'Mount Gambier Property Network — APN Real Estate',
    addressLines: ['178 Commercial Street East,', 'Mount Gambier SA 5290'],
    mapsQuery: '178 Commercial Street East, Mount Gambier SA 5290',
    phone: '1300 123 276',
    // From APN's own sales listing photography, so the alt text doesn't
    // claim APN manages it.
    photo: mountGambierStreet,
    photoAlt: 'Homes on a hillside street in Mount Gambier',
    about:
      'A local team on Commercial Street East looking after Mount Gambier landlords, tenants and their properties.',
  },
};

export const OFFICE_LIST: Office[] = [OFFICES.adelaide, OFFICES['mount-gambier']];

/** Inside the Blair Athol office: the contact page hero and the gallery
 *  on /our-story/. */
export const BLAIR_ATHOL_PHOTOS = {
  reception: { photo: blairAtholReception, alt: 'Reception at APN’s Blair Athol office, with the Adelaide Property Network logo on the wall' },
  meetingRoom: { photo: blairAtholMeetingRoom, alt: 'A glass-walled meeting room at the Blair Athol office' },
  boardroom: { photo: blairAtholBoardroom, alt: 'The boardroom at the Blair Athol office' },
  lounge: { photo: blairAtholLounge, alt: 'A meeting table looking out over the Blair Athol office' },
  hallway: { photo: blairAtholHallway, alt: 'A hallway in the Blair Athol office with the Adelaide Property Network logo' },
};
