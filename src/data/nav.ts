// Site navigation, shared by the header's menu and the footer. Every
// internal href here must be a path in routes.json.

import { REA_PROFILE_URL } from './business';

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

/** Shown inline in the header on wide screens. */
export const PRIMARY_NAV: NavLink[] = [
  { href: '/buy/', label: 'Buy' },
  { href: '/selling/', label: 'Sell' },
  { href: '/leasing/', label: 'Lease' },
  { href: '/our-people/', label: 'Our People' },
  { href: '/contact/', label: 'Contact' },
];

/** The full menu, grouped. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Buy',
    links: [
      { href: '/buy/', label: 'For Sale' },
      { href: '/sold/', label: 'Recently Sold' },
      { href: '/buy/#register', label: 'Join Our Buyer List' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { href: '/selling/', label: 'Selling With APN' },
      { href: '/appraisal/?type=sales', label: 'Sales Appraisal' },
    ],
  },
  {
    title: 'Lease',
    links: [
      { href: '/leasing/', label: 'Leasing & Property Management' },
      { href: '/rent/', label: 'For Rent' },
      { href: '/appraisal/?type=rental', label: 'Rental Appraisal' },
      { href: '/maintenance/', label: 'Repairs & Maintenance' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/our-story/', label: 'Our Story' },
      { href: '/our-people/', label: 'Our People' },
      { href: '/contact/', label: 'Contact Us' },
      { href: '/careers/', label: 'Careers' },
    ],
  },
];

/** Where each listing type lives until the site has its own feed. */
export const LISTINGS_LINKS = {
  buy: { href: REA_PROFILE_URL, label: 'For sale on realestate.com.au' },
  rent: { href: REA_PROFILE_URL, label: 'For rent on realestate.com.au' },
  sold: { href: REA_PROFILE_URL, label: 'Sold on realestate.com.au' },
};
