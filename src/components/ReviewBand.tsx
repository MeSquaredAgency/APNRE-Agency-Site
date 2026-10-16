import places from '../data/google-places.json';
import Icon from './Icon';
import { OFFICE_NAMES, Stars, useGoogleReviews, type OfficeId } from './GoogleReviews';

// A slim band of Google proof for the home page: both offices' live
// ratings, plus the first review Google returns (not hand-picked), cut to
// three lines with a link to read it in full on Google. Same rules as
// GoogleReviews.tsx: the numbers are live, never typed in, and the review
// is shown as written with its author.
//
// The page is pre-rendered with links to both Google listings, which the
// ratings replace once they load. The band keeps one height either way,
// so nothing below it jumps.

export default function ReviewBand() {
  const data = useGoogleReviews();
  const review = data?.reviews?.[0];

  return (
    <section className="review-band" aria-label="Google reviews">
      <div className="wrap review-band__row">
        <div className="review-band__ratings">
          {data?.offices ? (
            data.offices.map((o) => (
              <a className="review-band__rating" href={o.url} target="_blank" rel="noopener noreferrer" key={o.id}>
                <span className="review-band__score">{o.rating.toFixed(1)}</span>
                <span>
                  <Stars rating={o.rating} size={14} />
                  <span className="review-band__count">
                    {o.count} Google reviews · {o.name}
                  </span>
                </span>
              </a>
            ))
          ) : (
            <p className="review-band__fallback">
              Read our Google reviews:{' '}
              {(Object.keys(places) as OfficeId[]).map((office, i) => (
                <span key={office}>
                  {i > 0 && ' · '}
                  <a href={places[office].url} target="_blank" rel="noopener noreferrer">
                    {OFFICE_NAMES[office]}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>

        {review && (
          <figure className="review-band__quote">
            <blockquote>{review.text}</blockquote>
            <figcaption>
              {review.author}, {OFFICE_NAMES[review.office]} ·{' '}
              <a href={review.url} target="_blank" rel="noopener noreferrer">
                Read on Google <Icon name="external" />
              </a>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
