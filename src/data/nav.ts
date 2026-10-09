// Site navigation, shared by the header's menu and the footer. Every
// internal href here must be a path in routes.json.

import { REA_PROFILE_URL } from './business';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  title: string;
  /** Where the group heading itself links in the menu. */
  href: string;
  links: NavLink[];
}

/** Shown inline in the header on wide screens. */
export const PRIMARY_NAV: NavLink[] = [
  { href: '/buy/', label: 'Buy' },
  { href: '/selling/', label: 'Sell' },
  { href: '/rent/', label: 'Rent' },
  { href: '/leasing/', label: 'Property Management' },
  { href: '/our-story/', label: 'About Us' },
];

/** The full menu, grouped. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Buy',
    href: '/buy/',
    links: [
      { href: '/buy/', label: 'For Sale' },
      { href: '/buy/#register', label: 'Join Our Buyer List' },
      { href: '/client-hub/buyers/', label: 'Buyer Hub' },
      { href: '/our-people/?filter=sales', label: 'Sales Team' },
    ],
  },
  {
    title: 'Sell',
    href: '/selling/',
    links: [
      { href: '/selling/', label: 'Selling with APN Real Estate' },
      { href: '/appraisal/sales/', label: 'Sales Appraisal' },
      { href: '/sold/', label: 'Recent Sales' },
      { href: '/client-hub/sellers/', label: 'Seller Hub' },
    ],
  },
  {
    title: 'Rent',
    href: '/rent/',
    links: [
      { href: '/rent/', label: 'For Rent' },
      { href: '/commercial/', label: 'Commercial Leasing' },
      { href: '/rent/#register', label: 'Rental Alerts' },
      { href: '/office-space/', label: 'Office Space for Lease' },
      { href: '/client-hub/tenants/', label: 'Tenant Hub' },
      { href: '/client-hub/tenants/#repairs', label: 'Report a Repair' },
    ],
  },
  {
    title: 'Property Management',
    href: '/leasing/',
    links: [
      { href: '/leasing/', label: 'Property Management' },
      { href: '/appraisal/rental/', label: 'Rental Appraisal' },
      { href: '/client-hub/landlords/', label: 'Landlord Hub' },
      { href: '/our-people/?filter=property-management', label: 'Property Managers' },
    ],
  },
  {
    title: 'About Us',
    href: '/our-story/',
    links: [
      { href: '/our-story/', label: 'Our Story' },
      { href: '/our-people/', label: 'Our People' },
      { href: '/contact/', label: 'Contact Us' },
      { href: '/client-hub/', label: 'Client Hub' },
      { href: '/careers/', label: 'Work with Us' },
      { href: '/blog/', label: 'Blog' },
    ],
  },
];

/** Each listing type on APN Real Estate's realestate.com.au profile, the
 *  secondary link on /buy/, /rent/ and /sold/ (and the main one while a
 *  section is empty). */
export const LISTINGS_LINKS = {
  buy: { href: REA_PROFILE_URL, label: 'For sale on realestate.com.au' },
  rent: { href: REA_PROFILE_URL, label: 'For rent on realestate.com.au' },
  sold: { href: REA_PROFILE_URL, label: 'Sold on realestate.com.au' },
};

/** APN's agency profile, where client reviews are published. */
export const REVIEWS_URL = REA_PROFILE_URL;
