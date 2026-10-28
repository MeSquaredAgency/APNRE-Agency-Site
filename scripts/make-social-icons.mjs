// Social icons for email signatures: Facebook, Instagram and YouTube as
// 96x96 PNGs (shown at 48px, so they stay crisp on retina screens) in
// public/email/. Same look as the "Follow us" buttons on the site: the
// outline icon from src/components/Icon.tsx in ink, inside a white circle
// with a thin grey ring, transparent corners. PNG rather than SVG or WebP
// because Outlook for Windows won't show those. Files in public/ are
// copied into the build as-is, so each is served at a fixed address the
// signatures link to, e.g. https://apnre.com.au/email/facebook.png.
// Don't rename the output files.
//
//   node scripts/make-social-icons.mjs

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/email');

const SIZE = 96;
const RING = '#e3e3e3'; // --line (12% ink) over white
const INK = '#111111'; // --ink

// Copied from PATHS in src/components/Icon.tsx (24x24 viewBox, stroked).
const ICONS = {
  facebook: 'M15.5 3H13a3.5 3.5 0 0 0-3.5 3.5V10H7v3.5h2.5V21H13v-7.5h2.5l.5-3.5h-3V7a1 1 0 0 1 1-1h2z',
  instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01',
  youtube:
    'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8A26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15l5-3-5-3z',
};

// The icon is drawn at 20px of a 42px button on the site; same ratio here.
const ICON_PX = (SIZE * 20) / 42;
const OFFSET = (SIZE - ICON_PX) / 2;
const SCALE = ICON_PX / 24;

function svg(path) {
  const c = SIZE / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">` +
    `<circle cx="${c}" cy="${c}" r="${c - 1}" fill="#fff" stroke="${RING}" stroke-width="2"/>` +
    `<g transform="translate(${OFFSET} ${OFFSET}) scale(${SCALE})" fill="none" stroke="${INK}" ` +
    `stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></g>` +
    `</svg>`
  );
}

await mkdir(outDir, { recursive: true });
for (const [name, path] of Object.entries(ICONS)) {
  const out = resolve(outDir, `${name}.png`);
  await sharp(Buffer.from(svg(path)), { density: 288 }).resize(SIZE, SIZE).png().toFile(out);
  console.log(`wrote public/email/${name}.png`);
}
