// Photos and logos asked for in the director's review (Oct 2026) that
// haven't been supplied yet. Each has a fixed file name: drop the file in
// and the next build uses it, with no code change. Until then the page
// keeps what it showed before (or, for the Mount Gambier office, its
// logo). The full list, with what each one replaces, is in
// docs/supplied-assets.md.

import type { Photo } from '../lib/photo';

// TODO(supplied-assets): add these files to src/assets/photos/supplied/
// (JPEG, PNG or WebP, at least 1600px wide; the build makes the WebP
// copies and sets their size), and write each one's alt text in PHOTO_ALT.
//   home-tile-for-sale    home page "Properties for sale" tile
//   home-tile-for-rent    home page "Properties for rent" tile
//   hub-sellers           home page "Seller hub" card
//   hub-buyers            home page "Buyer hub" card
//   rent-hero             /rent/ hero: a generic Adelaide/SA property
//   mount-gambier-office  the office at 178 Commercial Street East
export type SuppliedPhotoName =
  | 'home-tile-for-sale'
  | 'home-tile-for-rent'
  | 'hub-sellers'
  | 'hub-buyers'
  | 'rent-hero'
  | 'mount-gambier-office';

const PHOTOS = import.meta.glob<Photo>('../assets/photos/supplied/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
  query: '?photo',
});

/** Describe what's in the photo once it's supplied. The tiles and hub
 *  cards are links named by their own text, so their photos stay
 *  decorative (empty alt). */
const PHOTO_ALT: Record<SuppliedPhotoName, string> = {
  'home-tile-for-sale': '',
  'home-tile-for-rent': '',
  'hub-sellers': '',
  'hub-buyers': '',
  // TODO(supplied-assets): describe the photo, e.g. the street or home shown.
  'rent-hero': '',
  'mount-gambier-office':
    'The Mount Gambier Property Network office at 178 Commercial Street East, Mount Gambier',
};

/** The supplied photo and its alt text, or undefined until it's added. */
export function suppliedPhoto(name: SuppliedPhotoName): { photo: Photo; alt: string } | undefined {
  const entry = Object.entries(PHOTOS).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === name);
  return entry && { photo: entry[1], alt: PHOTO_ALT[name] };
}

export interface Logo {
  src: string;
  width: number;
  height: number;
}

// The header and footer logo: the Adelaide and Mount Gambier Property
// Network logos side by side, reversed (light) for the dark header and
// footer, at src/assets/logo/apn-logo-side-reversed.png. Made in October
// 2026 from the logo files APN supplied, with their grey turned the same
// light tone (#E8E6E0) as adelaide-property-network-logo-reversed.png.
// Converted to WebP (which keeps the transparency) at build time. Without
// the file, the header and footer fall back to the Adelaide logo alone.
const LOGOS = import.meta.glob<Logo>('../assets/logo/apn-logo-side-reversed.{png,webp}', {
  eager: true,
  import: 'default',
  query: '?format=webp&as=metadata',
});

/** The side-by-side logo for dark backgrounds. */
export const SIDE_LOGO_REVERSED: Logo | undefined = Object.values(LOGOS)[0];
export const SIDE_LOGO_ALT = 'Adelaide Property Network and Mount Gambier Property Network — APN Real Estate';
