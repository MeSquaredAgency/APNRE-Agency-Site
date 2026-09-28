/// <reference types="vite/client" />

/** A photo processed by vite-imagetools; see src/lib/photo.ts. */
declare module '*?photo' {
  const photo: import('./lib/photo').Photo;
  export default photo;
}

interface ImportMetaEnv {
  /** Cloudflare Turnstile site key. Blank = no spam-check widget. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}
