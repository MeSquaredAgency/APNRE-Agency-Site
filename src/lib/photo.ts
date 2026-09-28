// Photos are imported with a `?photo` suffix, e.g.
//   import hero from '../assets/photos/balcony-view-hills.jpg?photo';
// vite-imagetools (photoDefaults() in vite.config.ts) turns each one into
// WebP and JPEG copies, and gives back this object. Stock photos from
// Pexels are described the same way (src/data/media.ts), so every image
// on the site goes through src/components/Picture.tsx.

export interface Photo {
  /** Format ("webp", "jpeg") → srcset with width descriptors, for
   *  <source> tags. */
  sources: Record<string, string>;
  /** The fallback image, with its size in pixels. */
  img: { src: string; w: number; h: number };
}
