import type { Photo } from '../lib/photo';
import patrickPhoto from '../assets/team/patrick-nhim.jpg?photo';
import brettPhoto from '../assets/team/brett-david.jpg?photo';
import jennyPhoto from '../assets/team/jenny-saffin.jpg?photo';
import lukePhoto from '../assets/team/luke-whittaker.jpg?photo';
import marissaPhoto from '../assets/team/marissa-bowell.jpg?photo';
import breePhoto from '../assets/team/bree.jpg?photo';
import type { OfficeId } from './offices';

/** The team filters on /our-people/. Someone can be in more than one,
 *  e.g. a property manager who also sells. */
export type TeamGroup = 'sales' | 'property-management' | 'leadership';

// Every `role` and `registration` below comes from the title matrix
// Patrick sent for the email signatures (October 2026), which is the
// source of truth. Cards, profile pages and structured data all read them.
// Breeanna's line in the matrix reads "Command Centre" rather than a
// registration, so she has none here.

export interface TeamMember {
  name: string;
  role: string;
  /** Their own RLA or registration number, written as it should appear.
   *  Only ever from APN's records: never guessed. */
  registration?: string;
  /** Short list for the profile page, in the person's own terms. */
  expertise?: string[];
  initials: string;
  photo: Photo;
  /** Alt text for the photo: name and role, so it still says who this
   *  is when the image doesn't load or is read out. */
  photoAlt: string;
  groups: TeamGroup[];
  /** Which office they work from. */
  office: OfficeId;
  /** The person's bio, one string per paragraph. Only ever supplied
   *  copy, never invented detail (years of experience, personal history,
   *  etc); see docs/team-photos-and-bios.md. Optional, but everyone
   *  currently shown has a real supplied bio. */
  bio?: string[];
  /** Direct phone/email — only set once verified with APN. Never invent
   *  these; a landlord seeing a wrong number is worse than seeing none. */
  phone?: string;
  email?: string;
  /** CSS object-position for the portrait crop, e.g. 'center 20%'.
   *  Use this to fix inconsistent framing between photos without needing
   *  to re-crop the source image. Defaults to 'center' if omitted. */
  focalPoint?: string;
}

/** The anchor for someone's card on /our-people/ (e.g. #jenny-saffin),
 *  also used as their structured-data @id. */
export function teamMemberId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const TEAM: TeamMember[] = [
  {
    name: 'Luke Whittaker',
    role: 'Region Manager (Mount Gambier)',
    registration: 'Registered Sales Representative RSR 356548',
    initials: 'LW',
    photo: lukePhoto,
    photoAlt: 'Luke Whittaker, Region Manager, Mount Gambier',
    // Sales and leadership too: he works across commercial sales and
    // assists with residential sales, and the director's review puts him
    // in Management alongside Brett.
    groups: ['property-management', 'sales', 'leadership'],
    office: 'mount-gambier',
    // Supplied by Patrick, 9 Oct 2026, as were Marissa's, Breeanna's,
    // Patrick's and Brett's below.
    bio: [
      'As Region Manager for Mount Gambier, Luke brings a calm, highly methodical approach to every aspect of property management and real estate. Backed by an extensive background in the hospitality sector, he excels in client relationship management, clear communication and high-level problem-solving.',
      'Since bringing these skills to APN Real Estate — where he has spent his entire property management career — Luke has built a strong reputation for navigating complex tenancies and resolving challenging insurance claims with precision and ease. His expertise spans residential property management, commercial sales and leasing, and residential sales support, making him a versatile and reliable partner for property owners, buyers and tenants alike.',
      'Outside of work, Luke is a dedicated family man who spends his weekends following his passion for sports, including F1, AFL, soccer and cricket.',
    ],
    expertise: [
      'Complex tenancy management',
      'Insurance claims',
      'Commercial sales and leasing',
      'Residential sales',
      'Mount Gambier market knowledge',
    ],
  },
  {
    name: 'Marissa Bowell',
    role: 'Property Manager (Greater Northern)',
    registration: 'Licensed Land Agent RLA 358014',
    initials: 'MB',
    photo: marissaPhoto,
    photoAlt: 'Marissa Bowell, Property Manager (Greater Northern), Blair Athol',
    groups: ['property-management', 'sales'],
    office: 'adelaide',
    // Patrick's bio said "now a fully licensed Sales Consultant"; "also"
    // keeps it true alongside her Property Manager title from the matrix.
    bio: [
      'With more than four years in real estate, Marissa has built a dynamic career at APN Real Estate. Starting in the APN Real Estate cadet program managing the command centre, she progressed into property management and is now also a fully licensed sales consultant.',
      'Her broad background spans tenant screening, lease administration, property maintenance and sales. Known for her proactive approach, Marissa delivers tailored, high-quality service to landlords, buyers and vendors alike.',
      'Outside of work, Marissa stays active and deeply involved in her community. She’s team manager for her son’s local footy team alongside her husband, who coaches, and enjoys spending her spare time with family and friends.',
    ],
  },
  {
    name: 'Jenny Saffin',
    role: 'Property Manager',
    // The matrix had "RLA XXXXX"; Elliot supplied the number on 7 Oct 2026.
    registration: 'Licensed Property Manager RPM 327884',
    initials: 'JS',
    photo: jennyPhoto,
    photoAlt: 'Jenny Saffin, Property Manager, Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: [
      'Jenny is a Property Manager at APN Real Estate, and has been working with landlords and tenants for more than two years. She owns an investment property herself, so she manages other people’s properties the way she’d want her own managed. Outside work, she’s usually at the gym, spending time with family and friends, or travelling.',
    ],
  },
  {
    name: 'Breeanna Arney',
    role: 'Property Manager (Trainee)',
    initials: 'BA',
    photo: breePhoto,
    photoAlt: 'Breeanna Arney, Property Manager (Trainee), Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: [
      'Joining APN Real Estate under our cadet program, Breeanna is rapidly mastering maintenance coordination, inspections and clear communication. Backed by a diverse work background with a strong work ethic at its core, she excels at turning hard work into smarter, more streamlined processes that deliver dependable support for landlords and tenants alike.',
      'Alongside her real estate career, Breeanna runs her own cleaning business and is a proud mother of three. Balancing a business and a busy family life has sharpened her organisational skills and her ability to keep everyday operations running smoothly.',
      'Outside of work, Breeanna enjoys spending quality time with her family and making the most of her weekends.',
    ],
  },
  {
    name: 'Patrick Nhim',
    role: 'Director & Founder',
    registration: 'Licensed Land Agent RLA 255335',
    initials: 'PN',
    photo: patrickPhoto,
    photoAlt: 'Patrick Nhim, Director and Founder',
    groups: ['leadership', 'sales'],
    office: 'adelaide',
    bio: [
      'Patrick founded the business — originally Adelaide Property Network, now APN Real Estate — and leads its sales team today. With a sales career spanning more than 25 years, he started humbly as a selling agent before growing APN Real Estate into the expanding agency it is today.',
      'By bridging sales intelligence with property management strategy, Patrick maintains direct oversight across both divisions. This gives him a real-time, ground-level view of market conditions across Adelaide and Mount Gambier, so property owners benefit from informed market insight, proactive asset management and strong results.',
      'Backed by a strong, independent team, Patrick remains actively involved in shaping the agency’s strategic vision and delivering superior client outcomes across both regions. Outside of work, he enjoys spending quality time with family, travel and the outdoors.',
    ],
  },
  {
    name: 'Brett David',
    role: 'Region Manager (Adelaide)',
    registration: 'Licensed Land Agent RLA 357963',
    initials: 'BD',
    photo: brettPhoto,
    photoAlt: 'Brett David, Region Manager, Adelaide',
    // Sales too: he's a licensed land agent, and the director's review
    // lists him on the sales page.
    groups: ['leadership', 'property-management', 'sales'],
    office: 'adelaide',
    bio: [
      'As Region Manager for Adelaide and a fully licensed land agent, Brett brings more than six years of property management experience, deep local market insight and a background in hospitality. Moving into real estate amid the economic turmoil of COVID-19, he built his career on resilience, adaptability and sharp management skills. Having worked in Adelaide through all market conditions, he adapts his approach readily, whether overseeing rental portfolios or managing business accounts.',
      'Brett’s blend of service-driven hospitality, property expertise and financial oversight ensures a seamless experience for clients.',
      'A dedicated family man outside of work, Brett is an avid fisherman who can usually be found competing in local club tournaments on weekends.',
    ],
  },
];

/** "Who you’ll work with." on /selling/, in this order. */
export const SALES_PAGE_TEAM = ['Patrick Nhim', 'Brett David', 'Luke Whittaker', 'Marissa Bowell'];

/** "Who runs APN." on /our-story/, in two groups. The grid keeps cards
 *  the same size however many are in a group, so adding a name here is
 *  all it takes. */
export const LEADERSHIP_GROUPS: { title: string; names: string[] }[] = [
  // TODO(fabienne): add 'Fabienne Nhim' (HR Director, People & Culture,
  // per the title matrix) with her entry in TEAM, a photo and a route in
  // routes.json when she's due on the page; not before.
  { title: 'Directors', names: ['Patrick Nhim'] },
  { title: 'Management', names: ['Brett David', 'Luke Whittaker'] },
];
