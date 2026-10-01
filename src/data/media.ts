// Stock photos from Pexels (free for commercial use, no attribution
// required, credited here anyway). Photos are served from Pexels' CDN,
// resized there: AVIF or WebP where supported, 800px for phones and 1200
// or 1600px for bigger screens, in the same Photo shape as a local `?photo` import so
// src/components/Picture.tsx handles both. The hero video is hosted on
// the site itself (public/video/); see docs/media.md.
//
// Stock imagery is illustrative only. Keep alt text and captions neutral,
// and never caption a stock shot as an APN listing, sale or managed
// property. Real APN photography lives in src/assets/photos/.

import type { Photo } from '../lib/photo';

export interface StockImage {
  photo: Photo;
  alt: string;
  credit: string;
}

/** A Pexels photo as a Photo. w/h are the photo's size at 1600px wide
 *  (measured once; the aspect ratio is what matters). */
function pexels(id: number, w: number, h: number): Photo {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb`;
  const set = (fm: string) =>
    [800, 1200, 1600].map((w) => `${base}&w=${w}${fm} ${w}w`).join(', ');
  return {
    // AVIF first: about 20% smaller than WebP from Pexels. A 1200px step
    // means a third-width card on a high-density laptop doesn't jump
    // straight to the 1600px copy.
    sources: { avif: set('&fm=avif'), webp: set('&fm=webp'), jpeg: set('') },
    img: { src: `${base}&w=1600`, w, h },
  };
}

export const HERO_VIDEO = {
  // "Aerial view of Adelaide skyline and Torrens River", by David on
  // Pexels, re-encoded as a short, lighter loop (see docs/media.md).
  src: '/video/adelaide-aerial-1080.mp4',
  srcSmall: '/video/adelaide-aerial-720.mp4',
  poster: '/video/adelaide-aerial-poster.jpg',
  /** Smaller WebP copies of the poster. scripts/build-pages.mjs preloads
   *  the same set, so keep the two in step. */
  posterSrcSet: '/video/adelaide-aerial-poster-800.webp 800w, /video/adelaide-aerial-poster-1600.webp 1600w',
  credit: 'David / Pexels',
  page: 'https://www.pexels.com/video/aerial-view-of-adelaide-skyline-and-torrens-river-36761129/',
};

export const STOCK = {
  houseExterior: {
    photo: pexels(7031581, 1600, 1068),
    alt: 'A contemporary house with a green lawn under a blue sky',
    credit: 'Max / Pexels',
  },
  townhouses: {
    photo: pexels(10628470, 1600, 1067),
    alt: 'A row of modern townhouses with driveways',
    credit: 'Curtis / Pexels',
  },
  livingRoom: {
    photo: pexels(29012619, 1600, 1573),
    alt: 'A bright living room with white sofas',
    credit: 'Beyza / Pexels',
  },
  openPlan: {
    photo: pexels(8089172, 1600, 1068),
    alt: 'An open-plan living room and kitchen',
    credit: 'Max / Pexels',
  },
  kitchen: {
    photo: pexels(7045356, 1600, 1067),
    alt: 'A modern kitchen with timber cabinets',
    credit: 'Max / Pexels',
  },
  keysCouple: {
    photo: pexels(8730048, 1600, 1068),
    alt: 'A couple being handed a set of house keys',
    credit: 'Kampus / Pexels',
  },
  keysHand: {
    photo: pexels(31651009, 1600, 1067),
    alt: 'A hand holding a set of house keys',
    credit: 'Jakub / Pexels',
  },
  suburbAerial: {
    // Shot in Melbourne, so the alt text doesn't say Adelaide.
    photo: pexels(14650435, 1600, 1200),
    alt: 'An aerial view of a leafy suburb',
    credit: 'Nenyasha / Pexels',
  },
} satisfies Record<string, StockImage>;
