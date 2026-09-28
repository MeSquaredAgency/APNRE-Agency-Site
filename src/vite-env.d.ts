/// <reference types="vite/client" />

/** A photo processed by vite-imagetools; see src/lib/photo.ts. */
declare module '*?photo' {
  const photo: import('./lib/photo').Photo;
  export default photo;
}

/** Set in vite.config.ts: whether any blog post is published. */
declare const __BLOG_HAS_POSTS__: boolean;

interface ImportMetaEnv {
  /** Cloudflare Turnstile site key. Blank = no spam-check widget. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Google Maps JavaScript API key, for address suggestions
   *  (src/lib/places.ts). Blank = plain address fields. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}
