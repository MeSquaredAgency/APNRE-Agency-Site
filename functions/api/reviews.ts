// GET /api/reviews: the latest Google reviews for both offices, for the
// reviews section on /landlords/ (src/components/GoogleReviews.tsx).
//
//   { ok: true, live: true, offices: [...], reviews: [...] }
//   { ok: true, live: false }   key not set, or Google didn't answer
//
// Read from the Places API (New) with GOOGLE_PLACES_API_KEY, a server-side
// key restricted to that API (docs/google-maps.md). Google returns up to
// five reviews per place, its "most relevant" ones, so this is up to ten.
// They're passed on as Google sends them: no editing and no filtering by
// star rating (Google's terms and the ACCC both rule out cherry-picking).
// Only reviews with no text are dropped, since a card needs words.
//
// Cached at Cloudflare's edge for a day, so Google is asked a few hundred
// times a month at most, well inside the free monthly credit.

import places from '../../src/data/google-places.json';
import { json } from '../_lib/forms';

interface Env {
  GOOGLE_PLACES_API_KEY?: string;
}

type OfficeId = keyof typeof places;

/** What the page shows for each office. Mirrors OFFICES in src/data/offices.ts. */
const OFFICE_NAMES: Record<OfficeId, string> = { adelaide: 'Adelaide', 'mount-gambier': 'Mount Gambier' };

const CACHE_SECONDS = 86400;
const FIELDS = 'rating,userRatingCount,googleMapsUri,reviews';

/** The parts of a Place Details (New) response this uses. */
interface GooglePlace {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    rating?: number;
    text?: { text?: string };
    /** In the reviewer's own language, when it differs from the one asked for. */
    originalText?: { text?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    googleMapsUri?: string;
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  }[];
}

export interface ReviewsResponse {
  ok: true;
  live: boolean;
  /** `received` is how many reviews Google sent for the office, before
   *  any without text are dropped: there for checking, not shown. */
  offices?: { id: OfficeId; name: string; rating: number; count: number; url: string; received: number }[];
  reviews?: {
    office: OfficeId;
    rating: number;
    text: string;
    when: string;
    publishTime: string;
    author: string;
    authorUrl: string;
    photo: string;
    url: string;
  }[];
}

async function fetchPlace(id: string, key: string): Promise<GooglePlace> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${id}?languageCode=en`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS },
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function load(key: string): Promise<ReviewsResponse> {
  const ids = Object.keys(places) as OfficeId[];
  const results = await Promise.all(ids.map((id) => fetchPlace(places[id].placeId, key)));

  const offices = ids.map((id, i) => ({
    id,
    name: OFFICE_NAMES[id],
    rating: results[i].rating ?? 0,
    count: results[i].userRatingCount ?? 0,
    url: results[i].googleMapsUri ?? places[id].url,
    received: results[i].reviews?.length ?? 0,
  }));

  const reviews = ids
    .flatMap((id, i) =>
      (results[i].reviews ?? []).map((r) => ({
        office: id,
        rating: r.rating ?? 0,
        text: (r.text?.text || r.originalText?.text || '').trim(),
        when: r.relativePublishTimeDescription ?? '',
        publishTime: r.publishTime ?? '',
        author: r.authorAttribution?.displayName ?? 'A Google user',
        authorUrl: r.authorAttribution?.uri ?? '',
        photo: r.authorAttribution?.photoUri ?? '',
        url: r.googleMapsUri ?? places[id].url,
      })),
    )
    .filter((r) => r.text)
    // Newest first, across both offices.
    .sort((a, b) => b.publishTime.localeCompare(a.publishTime));

  return { ok: true, live: true, offices, reviews };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  if (!env.GOOGLE_PLACES_API_KEY) return json({ ok: true, live: false } satisfies ReviewsResponse);

  const cache = caches.default;
  // Bump the version to drop what's cached after changing the response.
  const cacheKey = new Request(new URL('/api/reviews?v=2', request.url).toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const body = await load(env.GOOGLE_PLACES_API_KEY);
    const res = json(body);
    // Only keep an answer that has reviews in it, so a bad answer from
    // Google is retried on the next visit rather than kept for a day.
    if (body.reviews?.length) {
      res.headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}`);
      waitUntil(cache.put(cacheKey, res.clone()));
    } else {
      console.warn('Google sent no reviews with text:', JSON.stringify(body.offices));
    }
    return res;
  } catch (err) {
    // The page falls back to links to the Google listings.
    console.warn('Google reviews unavailable:', err);
    return json({ ok: true, live: false } satisfies ReviewsResponse);
  }
};
