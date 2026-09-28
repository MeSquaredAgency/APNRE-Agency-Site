import { OFFICE_LIST } from '../data/offices';

// NOTE: We deliberately do not hardcode a review count, rating, or
// leasing volume here. Those figures move over time and a stale number
// on a live campaign page is worse than no number — link straight to
// APN's live realestate.com.au agency profile instead.
const REVIEWS_PROFILE_URL = 'https://www.realestate.com.au/agency/adelaide-property-network-blair-athol-JIASZF';

// Review quotes come from each office's successStories in
// src/data/offices.ts (real quotes only, with the client's OK). The
// homepage shows up to three. Until any exist this section is copy plus
// the reviews link. It used to show photos of "Sold" signs, but those
// carry the old Adelaide Property Network branding and are sales results
// rather than property management ones.
const QUOTES = OFFICE_LIST.flatMap((office) => office.successStories).slice(0, 3);

export default function Proof() {
  return (
    <section id="proof" className="section section-paper-dim proof">
      <div className={`wrap proof__inner${QUOTES.length === 0 ? ' proof__inner--solo' : ''}`}>
        <div className="proof__copy">
          <span className="eyebrow">Proof, not promises</span>
          <h2 className="h-2">Real people. Real properties. Real accountability.</h2>
          <p className="body-copy">
            You’ll know the name of the property manager looking after your
            property, and how to reach them directly. For feedback on our
            service specifically, the most current source is our reviews —
            not a number quoted on this page.
          </p>
          <a
            href={REVIEWS_PROFILE_URL}
            className="proof__link"
            target="_blank"
            rel="noopener noreferrer"
          >
            See our current reviews on realestate.com.au ↗
          </a>
        </div>

        {QUOTES.length > 0 && (
          <div className="proof__quotes">
            {QUOTES.map((story) => (
              <figure className="stories__card" key={story.quote}>
                <blockquote>
                  <p>“{story.quote}”</p>
                </blockquote>
                <figcaption>
                  <strong>{story.attribution}</strong>
                  {story.suburb && <span>{story.suburb}</span>}
                  {story.sourceLabel && <span>{story.sourceLabel}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
