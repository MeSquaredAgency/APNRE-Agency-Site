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
//
// TODO(registration-numbers): Jenny's RLA number (the matrix has
// "RLA XXXXX"). Breeanna's line in the matrix reads "Command Centre"
// rather than a registration, so she has none here.

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
  /** Concise, factual, role-based copy — no invented biographical detail
   *  (years of experience, personal history, etc). Replace with a real
   *  first-person bio if/when APN supplies one; see
   *  docs/team-photos-and-bios.md. Optional, but everyone currently
   *  shown has a real supplied bio. */
  bio?: string;
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
    // Supplied by Luke, October 2026. "14 months" is as of then.
    bio: 'Luke is APN Real Estate’s Region Manager for Mount Gambier. He has spent 14 months in property management, all of it with APN Real Estate, and is known for taking on complex tenancies and difficult insurance claims with a steady, methodical approach. As well as residential property management, he works across commercial sales and leasing and assists with residential sales. Outside work, he’s a family man who spends his weekends watching F1, AFL, soccer and cricket.',
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
    bio: 'Marissa is a Property Manager at APN Real Estate, with four years of property management experience — covering tenant screening, lease management and maintenance for landlords, as well as sales. Outside work, she’s the team manager for her son’s local footy team, alongside her husband, who coaches — and otherwise usually active or spending time with family and friends.',
  },
  {
    name: 'Jenny Saffin',
    role: 'Property Manager (Leasing & Inspections)',
    initials: 'JS',
    photo: jennyPhoto,
    photoAlt: 'Jenny Saffin, Property Manager (Leasing & Inspections), Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: 'Jenny is a Property Manager at APN Real Estate, looking after leasing and inspections, and has been working with landlords and tenants for more than two years. She owns an investment property herself, so she manages other people’s properties the way she’d want her own managed. Outside work, she’s usually at the gym, spending time with family and friends, or travelling.',
  },
  {
    name: 'Breeanna Arney',
    role: 'Property Manager (Trainee)',
    initials: 'BA',
    photo: breePhoto,
    photoAlt: 'Breeanna Arney, Property Manager (Trainee), Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: 'Breeanna joined APN Real Estate in 2026 as a trainee property manager. She’s learning every part of the job, with a focus on clear communication, maintenance coordination and inspections, and on being helpful to landlords and tenants alike. Outside work, she runs her own cleaning business and is a mum of three, so she’s used to staying organised and on top of the detail through busy days.',
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
    bio: 'Patrick founded the business — originally Adelaide Property Network, now APN Real Estate — and leads its sales team today. Property management sits alongside that sales work rather than apart from it, so Patrick has direct oversight of how the two sides operate together, and a day-to-day view of the Adelaide and Mount Gambier markets that informs decisions made on the property management side for owners.',
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
    bio: 'Brett is APN Real Estate’s Region Manager for Adelaide, and a licensed land agent. He’s worked in property management for more than six years, managing rental properties for APN Real Estate landlords and looking after the accounts side of the business. Outside work, he’s usually found fishing in local club tournaments.',
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
