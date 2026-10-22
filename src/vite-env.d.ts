/// <reference types="vite/client" />

/** A photo processed by vite-imagetools; see src/lib/photo.ts. */
declare module '*?photo' {
  const photo: import('./lib/photo').Photo;
  export default photo;
}

/** An image resized by vite-imagetools, e.g. `logo.png?w=96&format=webp`. */
declare module '*format=webp' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  /** Cloudflare Turnstile site key. Blank = no spam-check widget. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  /** Google Maps JavaScript API key, for address suggestions
   *  (src/lib/places.ts). Blank = plain address fields. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

/** Where the header's Rent menu goes: /commercial/ while the listings
 *  feed has commercial leases but no homes for rent, /rent/ otherwise.
 *  Worked out from src/data/listings.json at build time (vite.config.ts),
 *  so the listings themselves stay out of the code every page loads. */
declare const __RENT_MENU_HREF__: string;
