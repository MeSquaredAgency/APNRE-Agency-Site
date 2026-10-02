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

import { mkdirSync } from 'node:fs';
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
  leasing: { file: photo('balcony-view-hills.jpg'), alt: 'View across the Adelaide hills from one of the properties APN manages' },
  buy: { file: photo('mount-gambier-hillside-street.jpg'), alt: 'Homes on a hillside street in Mount Gambier' },
  rent: { file: photo('interior-corner-windows.jpg'), alt: 'Floor-to-ceiling corner windows in a property managed by APN' },
  sold: { file: photo('sold-sign-ridley.jpg'), alt: 'An Adelaide Property Network SOLD sign outside a brick home', position: 'right', logo: false },
  'office-space': { file: photo('office/blair-athol-hallway.jpg'), alt: 'A hallway in the Adelaide Property Network office at 420B Main North Road, Blair Athol', logo: false },
  contact: { file: photo('office/blair-athol-frontage.jpg'), alt: 'The Adelaide Property Network office at 420B Main North Road, Blair Athol', logo: false },
  story: { file: photo('agent-placing-sold-sticker.jpg'), alt: 'A SOLD sticker going up on an Adelaide Property Network auction sign', logo: false },
};

const W = 1200;
const H = 630;

const shade = Buffer.from(
  `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/>` +
    `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>` +
    `<rect y="${H - 8}" width="${W}" height="8" fill="#8dc600"/></svg>`,
);

async function make(page, { file, position = 'centre', logo: withLogo = true }, logo) {
  await sharp(file)
    .resize(W, H, { fit: 'cover', position })
    .composite([
      { input: shade },
      ...(withLogo ? [{ input: logo, left: 56, top: H - 56 - 8 - (await sharp(logo).metadata()).height }] : []),
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(join(OUT, `${page}.jpg`));
}

export async function buildOgImages(pages) {
  mkdirSync(OUT, { recursive: true });
  const logo = await sharp(join(ROOT, 'src/assets/logo/adelaide-property-network-logo-reversed.png'))
    .resize({ height: 110 })
    .png()
    .toBuffer();
  await Promise.all(pages.map((page) => make(page, OG_PHOTOS[page] ?? OG_DEFAULT, logo)));
}
