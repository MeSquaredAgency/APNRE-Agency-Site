// One page per listing from PropertyMe's feed, at /buy/<slug>/,
// /rent/<slug>/ or /sold/<slug>/ (scripts/routes.mjs adds them to the
// build). Listing picks its listing from the path, the way Person picks
// a team member. Only what the feed holds is shown: nothing is filled in
// when PropertyMe leaves it out. See docs/listings-feed.md.

import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import { CtaBand, FormSection, PageHero } from '../components/sections';
import { TEAM, teamMemberId } from '../data/team';
import { formatDay, LISTINGS, listingAddress, photoSrcSet, thumb, type Listing as ListingData } from '../lib/listings';
import { usePath } from '../lib/route';
import { breadcrumbList, SITE } from '../structured-data';
import { ListingFeatures } from './Listings';

const SECTIONS = {
  buy: { name: 'Buy', path: '/buy/', eyebrow: 'For sale' },
  rent: { name: 'Rent', path: '/rent/', eyebrow: 'For rent' },
  sold: { name: 'Sold', path: '/sold/', eyebrow: 'Sold' },
  commercial: { name: 'Commercial', path: '/commercial/', eyebrow: 'For lease' },
};

/** Photos shown straight away under the main one; the rest sit behind
 *  "Show all photos". */
const GRID_PHOTOS = 4;

function Photos({ listing, address }: { listing: ListingData; address: string }) {
  const photos = listing.photos ?? [];
  if (photos.length === 0) return null;
  const alt = (i: number) => `${address}, photo ${i + 1} of ${photos.length}`;
  // Thumbnails are the 800px copies; each opens the full-size photo.
  const tile = (i: number) => (
    <li key={photos[i]}>
      <a href={photos[i]} target="_blank" rel="noopener">
        <img src={thumb(listing, i)} alt={alt(i)} loading="lazy" decoding="async" />
      </a>
    </li>
  );
  const rest = photos.map((_, i) => i).slice(1);
  return (
    <div className="listing-photos">
      {/* The page's largest image (its LCP), so it's fetched first. React
          18 doesn't know fetchPriority yet; the lowercase attribute passes
          straight through (as in Picture). */}
      <img
        className="listing-photos__main"
        src={photos[0]}
        srcSet={photoSrcSet(listing, 0)}
        sizes="(max-width: 1360px) 100vw, 1232px"
        alt={alt(0)}
        decoding="async"
        {...{ fetchpriority: 'high' }}
      />
      {rest.length > 0 && <ul className="listing-photos__grid">{rest.slice(0, GRID_PHOTOS).map(tile)}</ul>}
      {rest.length > GRID_PHOTOS && (
        <details className="listing-photos__more">
          <summary>Show all {photos.length} photos</summary>
          <ul className="listing-photos__grid">{rest.slice(GRID_PHOTOS).map(tile)}</ul>
        </details>
      )}
    </div>
  );
}

/** The feed's plain-text description: blank lines between paragraphs,
 *  single line breaks kept. */
function Description({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i}>
          {para.split('\n').map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export default function Listing() {
  const path = usePath();
  // Blair Athol's offices have no page of their own (they're on
  // /office-space/).
  const listing = LISTINGS.find((l) => l.path === path && l.apnBuilding !== 'blair-athol');
  if (!listing) throw new Error(`No listing for ${path}; check src/data/listings.json (npm run pages)`);
  const section = SECTIONS[listing.section];
  const address = listingAddress(listing);
  const place = [listing.suburb, listing.state, listing.postcode].filter(Boolean).join(' ');

  const facts = [
    ['Property type', listing.category],
    ['Land size', listing.landArea],
    ['Building size', listing.buildingArea],
    ['Available from', listing.availableFrom && formatDay(listing.availableFrom)],
    ['Bond', listing.bond],
    ['Sold on', listing.soldDate && formatDay(listing.soldDate)],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <Layout>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          url: `${SITE}${path}`,
          name: listing.headline ?? address,
          ...(listing.photos?.length
            ? { image: listing.photos.map((src) => (src.startsWith('/') ? SITE + src : src)) }
            : {}),
          ...(listing.description ? { description: listing.description } : {}),
        }}
      />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: section.name, path: section.path },
          { name: address, path },
        ])}
      />
      <PageHero
        eyebrow={`${section.eyebrow} · ${listing.category}`}
        title={listing.street ?? listing.suburb}
        lede={listing.street ? place : undefined}
      >
        <nav className="hub-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href={section.path}>{section.name}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{address}</span>
        </nav>
      </PageHero>

      <section className="section section-white">
        <div className="wrap listing">
          <Photos listing={listing} address={address} />

          <div className="listing__body">
            <div className="listing__copy">
              {listing.headline && <h2 className="h-2">{listing.headline}</h2>}
              {listing.apnBuilding === 'mount-gambier' && (
                <p className="listing__note">
                  This space is in APN Real Estate’s own Mount Gambier office building.
                </p>
              )}
              {listing.description && <Description text={listing.description} />}
              {facts.length > 0 && (
                <dl className="listing__facts">
                  {facts.map(([term, value]) => (
                    <div key={term}>
                      <dt>{term}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {listing.floorplans?.map((src, i) => (
                <p key={src}>
                  <a href={src} target="_blank" rel="noopener noreferrer" className="listing__floorplan">
                    {listing.floorplans!.length > 1 ? `Floor plan ${i + 1}` : 'Floor plan'} <Icon name="external" />
                  </a>
                </p>
              ))}
            </div>

            <aside className="listing__aside" aria-label="Price, inspections and agent">
              <div className="listing__box">
                {listing.underOffer && <p className="listing__badge">Under offer</p>}
                <p className="listing__price">{listing.price}</p>
                <ListingFeatures listing={listing} />
                {listing.section !== 'sold' && (
                  <a href="#enquire" className="btn btn-primary btn-block">
                    Enquire about this property <Icon name="arrow" />
                  </a>
                )}
              </div>

              {listing.section !== 'sold' && (
                <div className="listing__box">
                  <h2 className="h-3">Inspections</h2>
                  {listing.inspections?.length ? (
                    <ul className="listing__inspections">
                      {listing.inspections.map((time) => (
                        <li key={time}>
                          <Icon name="clock" /> {time}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No inspection times are listed yet. Enquire and we’ll let you know when you can see it.</p>
                  )}
                </div>
              )}

              {listing.agents?.length ? (
                <div className="listing__box">
                  <h2 className="h-3">{listing.agents.length > 1 ? 'Agents' : 'Agent'}</h2>
                  <ul className="listing__agents">
                    {listing.agents.map((agent) => {
                      const member = TEAM.find((m) => m.name.toLowerCase() === agent.name.toLowerCase());
                      return (
                        <li key={agent.name}>
                          {member ? (
                            <a href={`/our-people/${teamMemberId(member.name)}/`} className="listing__agent-name">
                              {agent.name}
                            </a>
                          ) : (
                            <span className="listing__agent-name">{agent.name}</span>
                          )}
                          {agent.phone && (
                            <a href={`tel:${agent.phone.replace(/[^\d+]/g, '')}`}>
                              <Icon name="phone" /> {agent.phone}
                            </a>
                          )}
                          {agent.email && (
                            <a href={`mailto:${agent.email}`}>
                              <Icon name="mail" /> {agent.email}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      {listing.section === 'sold' ? (
        <CtaBand
          title="Thinking of selling nearby?"
          copy="Book a free sales appraisal and we’ll walk you through recent comparable sales near you."
          href="/appraisal/sales/"
          label="Book a Sales Appraisal"
        />
      ) : (
        <FormSection
          id="enquire"
          eyebrow="Enquire"
          title="Ask about this property."
          copy={`Questions about ${address}? Send them through and the agent will get back to you.`}
        >
          <EnquiryForm kind="listing" submitLabel="Send Enquiry" listing={{ id: listing.id, address }} />
        </FormSection>
      )}
    </Layout>
  );
}
