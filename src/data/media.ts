// Stock photos from Pexels (free for commercial use, no attribution
// required, credited here anyway), downloaded at 1600px wide into
// src/assets/photos/stock/ and served from this site like APN's own
// photos (the `?photo` pipeline: WebP and JPEG, with an 800px copy for
// phones). They used to be hot-linked from Pexels' CDN, a third-party
// host the October 2026 SEO audit flagged. The hero video is hosted on
// the site too (public/video/); see docs/media.md.
//
// Stock imagery is illustrative only. Keep alt text and captions neutral,
// and never caption a stock shot as an APN listing, sale or managed
// property. Real APN photography lives in src/assets/photos/; swap these
// for real photos as they're taken.

import type { Photo } from '../lib/photo';
import houseExterior from '../assets/photos/stock/house-exterior.jpg?photo';
import openPlan from '../assets/photos/stock/open-plan.jpg?photo';
import keysCouple from '../assets/photos/stock/keys-couple.jpg?photo';
import keysHand from '../assets/photos/stock/keys-hand.jpg?photo';

export interface StockImage {
  photo: Photo;
  alt: string;
  credit: string;
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
    // pexels.com/photo/7031581
    photo: houseExterior,
    alt: 'A contemporary house with a green lawn under a blue sky',
    credit: 'Max / Pexels',
  },
  openPlan: {
    // pexels.com/photo/8089172
    photo: openPlan,
    alt: 'An open-plan living room and kitchen',
    credit: 'Max / Pexels',
  },
  keysCouple: {
    // pexels.com/photo/8730048
    photo: keysCouple,
    alt: 'A couple being handed a set of house keys',
    credit: 'Kampus / Pexels',
  },
  keysHand: {
    // pexels.com/photo/31651009
    photo: keysHand,
    alt: 'A hand holding a set of house keys',
    credit: 'Jakub / Pexels',
  },
} satisfies Record<string, StockImage>;
