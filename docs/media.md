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
- **Stock photos** (Pexels) are listed in `src/data/media.ts`. Pexels
  resizes them on its CDN, so they're described with the same `Photo`
  shape: WebP at 800px and 1600px. Keep their alt text neutral, and never
  present a stock photo as an APN listing, sale or managed property.

## Hero video

`public/video/` holds the home page's background video, re-encoded from
the Pexels clip (credited in `src/data/media.ts`):

| File | Size | Used on |
| --- | --- | --- |
| `adelaide-aerial-1080.mp4` | ~2.4 MB | wider than 900px |
| `adelaide-aerial-720.mp4` | ~1.1 MB | 900px and narrower |
| `adelaide-aerial-poster.jpg` | ~0.2 MB | shown first, and instead of the video for reduced motion or data saving |

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

Aim for under 3 MB at 1080p; raise `-crf` to shrink it further. Give the
new files new names (and update `HERO_VIDEO` in `src/data/media.ts`),
since `/video/*` is cached for a day (`public/_headers`).

## Link previews (og:image)

`scripts/og-images.mjs` makes a 1200×630 preview image for every page at
build time, from the photo set for that page in `OG_PHOTOS`, and writes
it to `public/og/` (not committed). Pages not listed use the Adelaide
aerial. To change a page's preview, point its `OG_PHOTOS` entry at a
different photo and update its `alt`.
