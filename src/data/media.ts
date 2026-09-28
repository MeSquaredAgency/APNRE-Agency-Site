// Stock photos and video from Pexels (free for commercial use, no
// attribution required, credited here anyway). They're served from
// Pexels' CDN; to self-host, download the same files into
// src/assets/stock/ and import them instead.
//
// Stock imagery is illustrative only. Keep alt text and captions neutral,
// and never caption a stock shot as an APN listing, sale or managed
// property. Real APN photography lives in src/assets/photos/.

export interface StockImage {
  src: string;
  alt: string;
  credit: string;
}

const pexelsPhoto = (id: number, w = 1800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export const HERO_VIDEO = {
  // "Aerial view of Adelaide skyline and Torrens River", by David on Pexels.
  src: 'https://videos.pexels.com/video-files/36761129/15579273_1920_1080_60fps.mp4',
  // Smaller file for phones.
  srcSmall: 'https://videos.pexels.com/video-files/36761129/15579272_1280_720_60fps.mp4',
  poster: 'https://images.pexels.com/videos/36761129/pexels-photo-36761129.jpeg?auto=compress&cs=tinysrgb&w=1920',
  credit: 'David / Pexels',
  page: 'https://www.pexels.com/video/aerial-view-of-adelaide-skyline-and-torrens-river-36761129/',
};

export const STOCK = {
  houseExterior: {
    src: pexelsPhoto(7031581),
    alt: 'A contemporary house with a green lawn under a blue sky',
    credit: 'Max / Pexels',
  },
  townhouses: {
    src: pexelsPhoto(10628470),
    alt: 'A row of modern townhouses with driveways',
    credit: 'Curtis / Pexels',
  },
  livingRoom: {
    src: pexelsPhoto(29012619),
    alt: 'A bright living room with white sofas',
    credit: 'Beyza / Pexels',
  },
  openPlan: {
    src: pexelsPhoto(8089172),
    alt: 'An open-plan living room and kitchen',
    credit: 'Max / Pexels',
  },
  kitchen: {
    src: pexelsPhoto(7045356),
    alt: 'A modern kitchen with timber cabinets',
    credit: 'Max / Pexels',
  },
  keysCouple: {
    src: pexelsPhoto(8730048),
    alt: 'A couple being handed a set of house keys',
    credit: 'Kampus / Pexels',
  },
  keysHand: {
    src: pexelsPhoto(31651009),
    alt: 'A hand holding a set of house keys',
    credit: 'Jakub / Pexels',
  },
  suburbAerial: {
    // Shot in Melbourne, so the alt text doesn't say Adelaide.
    src: pexelsPhoto(14650435),
    alt: 'An aerial view of a leafy suburb',
    credit: 'Nenyasha / Pexels',
  },
} satisfies Record<string, StockImage>;
