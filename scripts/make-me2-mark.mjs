// The Me² mark for the Me² block at the right of the email signatures, as
// a PNG in public/email/ (PNG rather than SVG or WebP because Outlook for
// Windows won't show those). Files in public/ are copied into the build
// as-is, so it is served at a fixed address the signatures link to,
// https://apnre.com.au/email/me2.png. Don't rename the output file.
//
// From src/assets/me2-logo.svg: navy "me", coral "2", the version for a
// white background (public/me2-mark.webp is the light one for the site's
// dark footer). 144px wide, shown at 72px, so it stays crisp on retina
// screens.
//
//   node scripts/make-me2-mark.mjs

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WIDTH = 144;

const mark = await readFile(resolve(root, 'src/assets/me2-logo.svg'));
await sharp(mark, { density: 300 }).resize({ width: WIDTH }).png().toFile(resolve(root, 'public/email/me2.png'));
console.log('wrote public/email/me2.png');
