# Photos, video and link previews

## Photos

- **APN's own photos** go in `src/assets/photos/` (or `src/assets/team/`)
  and are imported with `?photo`:

  ```ts
  import soldSign from '../assets/photos/sold-sign-ridley.jpg?photo';
  ```

  The build turns each into WebP plus a JPEG fallback, with an 800px copy
  for phones, and `src/components/Picture.tsx` picks the right one. This
  is the same pipeline as the landing page repo.
- **Stock photos** (Pexels) are in `src/assets/photos/stock/`, listed
  with their credits in `src/data/media.ts` and imported with `?photo`
  like APN's own, so they're served from this site rather than
  hot-linked from Pexels. Keep their alt text neutral, never present a
  stock photo as an APN listing, sale or managed property, and replace
  them with real photos as APN supplies them.

## Hero video

`public/video/` holds the home page's background video, re-encoded from
the Pexels clip (credited in `src/data/media.ts`):

| File | Size | Used on |
| --- | --- | --- |
| `adelaide-aerial-1080.mp4` | ~2.4 MB | wider than 900px |
| `adelaide-aerial-720.mp4` | ~1.1 MB | 900px and narrower |
| `adelaide-aerial-poster-800.webp` | ~60 KB | the poster on phones |
| `adelaide-aerial-poster-1600.webp` | ~180 KB | the poster on bigger screens |
| `adelaide-aerial-poster.jpg` | ~0.2 MB | the poster in browsers without WebP |

The poster is shown first, and instead of the video for reduced motion
or data saving. It's an image under the video rather than the video's
`poster` attribute, so phones can get the smaller copy.

The pre-rendered page contains only the poster. The video is added once
the page is running, and not at all for visitors who prefer reduced
motion or have a data saver on.

To replace it, encode the new clip the same way (no audio, 30fps, H.264,
`+faststart` so it starts playing before it's fully downloaded):

```bash
ffmpeg -i source.mp4 -an -vf "fps=30,scale=1920:-2:flags=lanczos" -c:v libx264 -preset veryslow -crf 31 -pix_fmt yuv420p -movflags +faststart adelaide-aerial-1080.mp4
```

```bash
ffmpeg -i source.mp4 -an -vf "fps=30,scale=1280:-2:flags=lanczos" -c:v libx264 -preset veryslow -crf 31 -pix_fmt yuv420p -movflags +faststart adelaide-aerial-720.mp4
```

```bash
ffmpeg -ss 0.5 -i source.mp4 -frames:v 1 -vf "scale=1600:-2" -q:v 7 adelaide-aerial-poster.jpg
```

Then make the WebP copies from it (sharp is already installed, through
vite-imagetools):

```bash
node -e "const s=require('sharp');for(const w of [800,1600])s('public/video/adelaide-aerial-poster.jpg').resize(w).webp({quality:72}).toFile('public/video/adelaide-aerial-poster-'+w+'.webp')"
```

Aim for under 3 MB at 1080p; raise `-crf` to shrink it further. Give the
new files new names (and update `HERO_VIDEO` in `src/data/media.ts` and
the poster preload in `scripts/build-pages.mjs`),
since `/video/*` is cached for a day (`public/_headers`).

## Link previews (og:image)

`scripts/og-images.mjs` makes a 1200×630 preview image for every page at
build time, from the photo set for that page in `OG_PHOTOS`, and writes
it to `public/og/` (not committed). Pages not listed use the Adelaide
aerial. To change a page's preview, point its `OG_PHOTOS` entry at a
different photo and update its `alt`.
