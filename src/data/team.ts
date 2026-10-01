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

export interface TeamMember {
  name: string;
  role: string;
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
    role: 'Property Manager, Mount Gambier',
    initials: 'LW',
    photo: lukePhoto,
    photoAlt: 'Luke Whittaker, Property Manager, Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: 'Luke is a Property Manager based in Mount Gambier, and has worked in property management at APN since 2025. He handles complex tenancies and insurance claims, and also works across commercial sales and leasing and assists with residential sales. Outside work, he’s a family man who spends weekends watching F1, AFL, soccer or cricket.',
  },
  {
    name: 'Marissa Bowell',
    role: 'Property Manager / Sales Representative',
    initials: 'MB',
    photo: marissaPhoto,
    photoAlt: 'Marissa Bowell, Property Manager and Sales Representative, Blair Athol',
    groups: ['property-management', 'sales'],
    office: 'adelaide',
    bio: 'Marissa is a Property Manager and Sales Representative at APN, with four years of property management experience — covering tenant screening, lease management and maintenance for landlords, as well as sales. Outside work, she’s the team manager for her son’s local footy team, alongside her husband, who coaches — and otherwise usually active or spending time with family and friends.',
  },
  {
    name: 'Jenny Saffin',
    role: 'Property Manager',
    initials: 'JS',
    photo: jennyPhoto,
    photoAlt: 'Jenny Saffin, Property Manager, Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: 'Jenny is a Property Manager at APN, working with landlords and tenants for more than two years. She owns an investment property herself, so she manages other people’s properties the way she’d want her own managed. Outside work, she’s usually at the gym, spending time with family and friends, or travelling.',
  },
  {
    name: 'Breeanna Arney',
    role: 'Property Management Trainee',
    initials: 'BA',
    photo: breePhoto,
    photoAlt: 'Breeanna Arney, Property Management Trainee, Mount Gambier',
    groups: ['property-management'],
    office: 'mount-gambier',
    bio: 'Breeanna joined APN in 2026 as a Property Management Trainee. She’s learning every part of the job, with a focus on clear communication, maintenance coordination and inspections, and on being helpful to landlords and tenants alike. Outside work, she runs her own cleaning business and is a mum of three, so she’s used to staying organised and on top of the detail through busy days.',
  },
  {
    name: 'Patrick Nhim',
    role: 'Director',
    initials: 'PN',
    photo: patrickPhoto,
    photoAlt: 'Patrick Nhim, Director',
    groups: ['leadership', 'sales'],
    office: 'adelaide',
    bio: 'Patrick founded the business — originally Adelaide Property Network, now APN Real Estate — and leads its sales team today. Property management sits alongside that sales work rather than apart from it, so Patrick has direct oversight of how the two sides operate together, and a day-to-day view of the Adelaide and Mount Gambier markets that informs decisions made on the property management side for owners.',
  },
  {
    name: 'Brett David',
    role: 'Regional Manager / Head of Leasing & Accounts',
    initials: 'BD',
    photo: brettPhoto,
    photoAlt: 'Brett David, Regional Manager',
    groups: ['leadership', 'property-management'],
    office: 'adelaide',
    bio: 'Brett is APN’s Regional Manager and Head of Leasing & Accounts, and a licensed sales agent. He’s worked in property management for more than six years, managing rental properties for APN landlords and looking after the accounts side of the business. Outside work, he’s usually found fishing in local club tournaments.',
  },
];
