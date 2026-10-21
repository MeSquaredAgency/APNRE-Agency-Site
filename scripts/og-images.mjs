// Makes each page's link-preview image (og:image): its photo cropped to
// 1200×630, darkened towards the bottom, with the reversed APN logo in
// the corner. Written to public/og/<page>.jpg (gitignored) before `dev`
// and `build`. No text is drawn into the image: fonts differ between
// this machine and Cloudflare's build servers, and previews show the
// page title under the image anyway.
//
// Which photo each page uses is OG_PHOTOS below; pages not listed get
// the home image. Real APN photos where there is one, plus the stock
// Adelaide aerial from the hero video for the rest. logo: false for
// photos that already show APN's signage, so the logo isn't doubled up.
//
// Each team member's page gets their own: their headshot beside the logo
// on a dark panel (ogKey and the person-<id> entries below), so sharing
// one profile doesn't look like sharing any other.

import { mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/og');
const photo = (name) => join(ROOT, 'src/assets/photos', name);

export const OG_DEFAULT = {
  file: join(ROOT, 'public/video/adelaide-aerial-poster.jpg'),
  alt: 'Aerial view of Adelaide’s city skyline and the River Torrens',
};

export const OG_PHOTOS = {
  home: OG_DEFAULT,
  selling: { file: photo('sold-sign-fenden-rd.jpg'), alt: 'An Adelaide Property Network SOLD sign outside a home in Salisbury', position: 'left', logo: false },
  leasing: { file: photo('balcony-view-hills.jpg'), alt: 'View across the Adelaide hills from one of the properties APN Real Estate manages' },
  buy: { file: photo('mount-gambier-hillside-street.jpg'), alt: 'Homes on a hillside street in Mount Gambier' },
  rent: { file: photo('interior-corner-windows.jpg'), alt: 'Floor-to-ceiling corner windows in a property managed by APN Real Estate' },
  sold: { file: photo('sold-sign-ridley.jpg'), alt: 'An Adelaide Property Network SOLD sign outside a brick home', position: 'right', logo: false },
  'office-space': { file: photo('office/blair-athol-hallway.jpg'), alt: 'A hallway in the Adelaide Property Network office at 420B Main North Road, Blair Athol', logo: false },
  contact: { file: photo('office/blair-athol-frontage.jpg'), alt: 'The Adelaide Property Network office at 420B Main North Road, Blair Athol', logo: false },
  'office-adelaide': { file: photo('office/blair-athol-frontage.jpg'), alt: 'The Adelaide Property Network office at 420B Main North Road, Blair Athol', logo: false },
  'office-mount-gambier': { file: photo('mount-gambier-hillside-street.jpg'), alt: 'Homes on a hillside street in Mount Gambier' },
  story: { file: photo('agent-placing-sold-sticker.jpg'), alt: 'A SOLD sticker going up on an Adelaide Property Network auction sign', logo: false },
  switching: { file: photo('interior-corner-windows.jpg'), alt: 'Floor-to-ceiling corner windows in a property managed by APN Real Estate' },
  appraisal: { file: photo('sold-sign-fenden-rd.jpg'), alt: 'An Adelaide Property Network SOLD sign outside a home in Salisbury', position: 'left', logo: false },
  'appraisal-sales': { file: photo('sold-sign-fenden-rd.jpg'), alt: 'An Adelaide Property Network SOLD sign outside a home in Salisbury', position: 'left', logo: false },
  'appraisal-rental': { file: photo('balcony-view-wide.jpg'), alt: 'The view from the balcony of a property APN Real Estate manages' },
  'mount-gambier-rental-appraisal': { file: photo('mount-gambier-hillside-street.jpg'), alt: 'Homes on a hillside street in Mount Gambier' },
  'mount-gambier-pm': { file: photo('mount-gambier-hillside-street.jpg'), alt: 'Homes on a hillside street in Mount Gambier' },
  commercial: { file: photo('office/blair-athol-meeting-room.jpg'), alt: 'A glass-walled meeting room at APN Real Estate’s Blair Athol office', logo: false },
  people: { file: photo('office/blair-athol-reception.jpg'), alt: 'Reception at APN Real Estate’s Blair Athol office, with the Adelaide Property Network logo on the wall', logo: false },
  careers: { file: photo('office/blair-athol-lounge.jpg'), alt: 'A meeting table looking out over APN Real Estate’s Blair Athol office', logo: false },
  hub: { file: photo('balcony-view-wide.jpg'), alt: 'The view from the balcony of a property APN Real Estate manages' },
  'hub-tenants': { file: photo('interior-corner-windows.jpg'), alt: 'Floor-to-ceiling corner windows in a property managed by APN Real Estate' },
  // person-<id>: one per headshot in src/assets/team/, named like the
  // person's page (/our-people/<id>/).
  ...Object.fromEntries(
    readdirSync(join(ROOT, 'src/assets/team'))
      .filter((f) => /\.jpe?g$/.test(f))
      .map((f) => {
        const id = f.replace(/\.jpe?g$/, '');
        const name = id.replace(/(^|-)([a-z])/g, (_, sep, c) => `${sep ? ' ' : ''}${c.toUpperCase()}`);
        return [`person-${id}`, { file: join(ROOT, 'src/assets/team', f), alt: `${name}, APN Real Estate`, portrait: true }];
      }),
  ),
};

/** Which OG_PHOTOS entry, and /og/<key>.jpg, a route uses: its page id,
 *  or person-<id> for a team member's page. */
export const ogKey = (route) =>
  route.page === 'person' ? `person-${route.path.split('/').filter(Boolean).pop()}` : route.page;

const LOGO_FILE = join(ROOT, 'src/assets/logo/adelaide-property-network-logo-reversed.png');
const W = 1200;
const H = 630;

const shade = Buffer.from(
  `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/>` +
    `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>` +
    `<rect y="${H - 8}" width="${W}" height="8" fill="#8dc600"/></svg>`,
);

/** A headshot on the right of a dark panel, with the logo, larger than
 *  on the photos, centred in the space to its left. */
async function makePortrait(key, file, logoFile) {
  const height = H - 8;
  const faceWidth = Math.round(height * 0.8);
  const face = await sharp(file).resize({ height, width: faceWidth, fit: 'cover', position: 'north' }).toBuffer();
  const logo = await sharp(logoFile).resize({ height: 220 }).png().toBuffer();
  const { width: logoWidth, height: logoHeight } = await sharp(logo).metadata();
  await sharp({ create: { width: W, height: H, channels: 3, background: '#111111' } })
    .composite([
      { input: face, left: W - faceWidth, top: 0 },
      { input: logo, left: Math.round((W - faceWidth - logoWidth) / 2), top: Math.round((height - logoHeight) / 2) },
      { input: Buffer.from(`<svg width="${W}" height="8"><rect width="${W}" height="8" fill="#8dc600"/></svg>`), left: 0, top: H - 8 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, `${key}.jpg`));
}

async function make(page, { file, position = 'centre', logo: withLogo = true, portrait = false }, logo) {
  if (portrait) return makePortrait(page, file, LOGO_FILE);
  await sharp(file)
    .resize(W, H, { fit: 'cover', position })
    .composite([
      { input: shade },
      ...(withLogo ? [{ input: logo, left: 56, top: H - 56 - 8 - (await sharp(logo).metadata()).height }] : []),
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, `${page}.jpg`));
}

/** `pages`: the ogKey of each route that needs an image. */
export async function buildOgImages(pages) {
  mkdirSync(OUT, { recursive: true });
  const logo = await sharp(LOGO_FILE)
    .resize({ height: 110 })
    .png()
    .toBuffer();
  await Promise.all(pages.map((page) => make(page, OG_PHOTOS[page] ?? OG_DEFAULT, logo)));
}
