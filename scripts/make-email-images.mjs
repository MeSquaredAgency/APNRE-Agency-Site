// Staff photos for email signatures: a 160x160 circle with transparent
// corners, saved as PNG (Outlook for Windows won't show WebP) to
// public/email/staff/<name>.png. Files in public/ are copied into the
// build as-is, so each one is served at a fixed address that a rebuild
// never changes, e.g. https://apnre.com.au/email/staff/luke.png, which
// is what the signatures link to. Don't rename the output files.
//
// Re-run after replacing a photo in src/assets/team/:
//   node scripts/make-email-images.mjs
//
// The facebook, instagram and youtube icons in public/email/ are added
// by hand, not made here.

import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/email/staff');

const OUT_SIZE = 160;
// The circle is cut at 4x and then scaled down, for a smooth edge.
const WORK_SIZE = OUT_SIZE * 4;

// Framing, in pixels of the 1024x1280 originals. Each crop is a square
// CROP_SIZE wide, centred across on the person's face, with the line of
// their eyes EYE_LINE of the way down. That gives head and shoulders with
// room above the hair (and Jenny's bun).
const CROP_SIZE = 880;
const EYE_LINE = 0.4;

// Per person: the source photo, the output name, and the point midway
// between their eyes, measured on the original. The photographer didn't
// centre everyone the same, so this is what keeps the faces in the
// middle of every circle. Measure again if a photo is replaced.
const STAFF = [
  { src: 'patrick-nhim.jpg', out: 'patrick', eyes: { x: 580, y: 426 } },
  { src: 'brett-david.jpg', out: 'brett', eyes: { x: 590, y: 426 } },
  { src: 'marissa-bowell.jpg', out: 'marissa', eyes: { x: 512, y: 426 } },
  { src: 'luke-whittaker.jpg', out: 'luke', eyes: { x: 520, y: 436 } },
  { src: 'bree.jpg', out: 'breanna', eyes: { x: 582, y: 426 } },
  { src: 'jenny-saffin.jpg', out: 'jenny', eyes: { x: 522, y: 426 } },
];

const circleMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WORK_SIZE}" height="${WORK_SIZE}">` +
    `<circle cx="${WORK_SIZE / 2}" cy="${WORK_SIZE / 2}" r="${WORK_SIZE / 2}" fill="#fff"/></svg>`,
);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

async function makeCircle({ src, out, eyes }) {
  const input = resolve(root, 'src/assets/team', src);
  const { width, height } = await sharp(input).metadata();
  if (CROP_SIZE > width || CROP_SIZE > height) throw new Error(`${src} is smaller than the crop`);

  // Kept inside the photo, which nudges the face off-centre only if it's
  // very close to an edge.
  const left = Math.round(clamp(eyes.x - CROP_SIZE / 2, 0, width - CROP_SIZE));
  const top = Math.round(clamp(eyes.y - CROP_SIZE * EYE_LINE, 0, height - CROP_SIZE));

  const square = await sharp(input)
    .extract({ left, top, width: CROP_SIZE, height: CROP_SIZE })
    .resize(WORK_SIZE, WORK_SIZE)
    .ensureAlpha()
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const file = resolve(outDir, `${out}.png`);
  await sharp(square)
    .resize(OUT_SIZE, OUT_SIZE)
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90, effort: 10 })
    .toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });
for (const person of STAFF) {
  const file = await makeCircle(person);
  console.log(`Wrote ${file.slice(root.length + 1)}`);
}
