import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import places from '../data/google-places.json';
import { REVIEWS_URL } from '../data/nav';

// Live Google reviews for both offices, from /api/reviews
// (functions/api/reviews.ts), which reads the Places API and caches for a
// day. The page is pre-rendered with the fallback (a line of copy and
// links to the Google listings), and the reviews replace it once they
// load. If the API isn't set up or Google doesn't answer, the fallback
// stays, so the section never looks broken. The ratings and counts are
// live from Google, never typed into the page, so they can't go stale.
//
// Google's terms: reviews are shown as written (long ones are cut short
// with "Read more", never edited), each with its author and a link, and
// the section credits Google Maps. All of them are shown, whatever the
// star rating.

type OfficeId = keyof typeof places;

/** Matches ReviewsResponse in functions/api/reviews.ts. */
interface Reviews {
  ok: boolean;
  live: boolean;
  offices?: { id: OfficeId; name: string; rating: number; count: number; url: string }[];
  reviews?: {
    office: OfficeId;
    rating: number;
    text: string;
    when: string;
    author: string;
    authorUrl: string;
    photo: string;
    url: string;
  }[];
}

const OFFICE_NAMES: Record<OfficeId, string> = { adelaide: 'Adelaide', 'mount-gambier': 'Mount Gambier' };

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={n <= full ? 'is-on' : ''}>
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: NonNullable<Reviews['reviews']>[number] }) {
  const text = useRef<HTMLQuoteElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = text.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <figure className="review-card">
      <div className="review-card__top">
        <Stars rating={review.rating} />
        <span className="review-card__office">{OFFICE_NAMES[review.office]}</span>
      </div>
      <blockquote ref={text} className={`review-card__text${expanded ? ' is-expanded' : ''}`}>
        {review.text}
      </blockquote>
      {(overflows || expanded) && (
        <button type="button" className="review-card__more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      <figcaption className="review-card__author">
        {review.photo && (
          <img src={review.photo} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" />
        )}
        <span>
          {review.authorUrl ? (
            <a href={review.authorUrl} target="_blank" rel="noopener noreferrer">
              {review.author}
            </a>
          ) : (
            review.author
          )}
          <span className="review-card__when">
            <a href={review.url} target="_blank" rel="noopener noreferrer">
              {review.when} on Google
            </a>
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function GoogleReviews({ id }: { id?: string }) {
  const [data, setData] = useState<Reviews | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ back: false, forward: false });

  useEffect(() => {
    fetch('/api/reviews?v=2') // ?v= matches the cache version in functions/api/reviews.ts
      .then((res) => (res.ok ? res.json() : null))
      .then((body: Reviews | null) => body?.live && body.reviews?.length && setData(body))
      .catch(() => {});
  }, []);

  // The arrow buttons only show when there's more to scroll to.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setCanScroll({ back: el.scrollLeft > 4, forward: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [data]);

  const scroll = (direction: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  const googleLinks = (Object.keys(places) as OfficeId[]).map((office, i) => (
    <span key={office}>
      {i > 0 && ' · '}
      <a href={places[office].url} target="_blank" rel="noopener noreferrer">
        {OFFICE_NAMES[office]}
      </a>
    </span>
  ));

  return (
    <section className="section section-paper reviews" id={id}>
      <div className="wrap">
        <div className="reviews__head">
          <div>
            <span className="eyebrow">What our clients say</span>
            <h2 className="h-1 reviews__title">
              <span>Real people.</span> <span>Real properties.</span> <span>Real accountability.</span>
            </h2>
          </div>
          {data?.offices && (
            <div className="reviews__ratings">
              {data.offices.map((o) => (
                <a className="reviews__rating" href={o.url} target="_blank" rel="noopener noreferrer" key={o.id}>
                  <span className="reviews__score">{o.rating.toFixed(1)}</span>
                  <span>
                    <Stars rating={o.rating} size={14} />
                    <span className="reviews__count">
                      {o.count} Google reviews · {o.name}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {data?.reviews ? (
          <>
            <div className="reviews__track" ref={track} tabIndex={0} aria-label="Google reviews">
              {data.reviews.map((r) => (
                <ReviewCard review={r} key={r.url + r.author} />
              ))}
            </div>
            <div className="reviews__foot">
              <p className="reviews__source">
                Reviews from Google Maps, shown as written. See them all on Google: {googleLinks}
              </p>
              {(canScroll.back || canScroll.forward) && (
                <div className="reviews__arrows">
                  <button type="button" onClick={() => scroll(-1)} disabled={!canScroll.back} aria-label="Previous reviews">
                    <Icon name="arrow" />
                  </button>
                  <button type="button" onClick={() => scroll(1)} disabled={!canScroll.forward} aria-label="More reviews">
                    <Icon name="arrow" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="reviews__fallback">
            <p className="lede">
              You’ll know the name of the property manager looking after your property, and how to reach them
              directly. For what our clients think, read their reviews in their own words.
            </p>
            <div className="page-hero__actions">
              {(Object.keys(places) as OfficeId[]).map((office) => (
                <a
                  href={places[office].url}
                  className="btn btn-outline-dark"
                  target="_blank"
                  rel="noopener noreferrer"
                  key={office}
                >
                  {OFFICE_NAMES[office]} Google Reviews <Icon name="external" />
                </a>
              ))}
              <a href={REVIEWS_URL} className="btn btn-outline-dark" target="_blank" rel="noopener noreferrer">
                realestate.com.au Reviews <Icon name="external" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
