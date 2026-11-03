// One page per listing from PropertyMe's feed, at /buy/<slug>/,
// /rent/<slug>/ or /sold/<slug>/ (scripts/routes.mjs adds them to the
// build). Listing picks its listing from the path, the way Person picks
// a team member. Only what the feed holds is shown: nothing is filled in
// when PropertyMe leaves it out. See docs/listings-feed.md.

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import { CtaBand, FormSection, PageHero, SectionHead } from '../components/sections';
import { TEAM, teamMemberId } from '../data/team';
import { descriptionBlocks, descriptionSummary, dollarAmounts, linkParts, splitLabel } from '../lib/description';
import {
  formatDay,
  formatInspection,
  LISTINGS,
  listingAddress,
  listingsIn,
  MAIN_PHOTO_SIZES,
  mainPhotoSrcSet,
  photoSrcSet,
  thumb,
  tileSrcSet,
  type Listing as ListingData,
} from '../lib/listings';
import { usePath } from '../lib/route';
import { breadcrumbList, SITE } from '../structured-data';
import { ListingCard, ListingFeatures } from './Listings';

const SECTIONS = {
  buy: { name: 'Buy', path: '/buy/', eyebrow: 'For sale' },
  rent: { name: 'Rent', path: '/rent/', eyebrow: 'For rent' },
  sold: { name: 'Sold', path: '/sold/', eyebrow: 'Sold' },
  commercial: { name: 'Commercial', path: '/commercial/', eyebrow: 'For lease' },
};

/** Other listings shown under each one, in the same section. */
const MORE_LISTINGS = 3;
const MORE_TITLE = {
  buy: 'More properties for sale.',
  rent: 'More properties for rent.',
  sold: 'More recent sales.',
  commercial: 'More commercial property for lease.',
};

/** Street-name spellings that mean the same street, so "6B East Way" and
 *  "6C East Way" (or "Gray St" and "Gray Street") read as one street. */
const STREET_TYPES: Record<string, string> = {
  street: 'st',
  road: 'rd',
  avenue: 'ave',
  av: 'ave',
  terrace: 'tce',
  drive: 'dr',
  court: 'ct',
  crescent: 'cres',
  place: 'pl',
  parade: 'pde',
  highway: 'hwy',
  lane: 'ln',
  boulevard: 'bvd',
  close: 'cl',
  east: 'e',
  west: 'w',
  north: 'n',
  south: 's',
};

/** "6C East Way" → "east way", "2/178 Commercial Street East" →
 *  "commercial st e", plus the suburb; undefined when the street is
 *  hidden. */
function streetKey(l: ListingData): string | undefined {
  if (!l.street) return undefined;
  const words = l.street
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/\d/.test(w))
    .map((w) => STREET_TYPES[w] ?? w);
  return words.length ? `${words.join(' ')}|${(l.suburb ?? '').toLowerCase()}` : undefined;
}

/** True when two listings are on the same street in the same suburb. */
const sameStreet = (a: ListingData, b: ListingData) => {
  const key = streetKey(a);
  return key !== undefined && key === streetKey(b);
};

/** A few of the section's other listings: the ones after this one,
 *  wrapping round, so every listing is linked from other listings' pages
 *  as well as from /buy/, /rent/ or /commercial/.
 *
 *  Never one on the same street: neighbouring listings can be different
 *  vendors (6B and 6C East Way, Darlington), and one vendor's page must
 *  never market the other's property. */
function MoreListings({ listing }: { listing: ListingData }) {
  const all = listingsIn(listing.section);
  const i = all.findIndex((l) => l.id === listing.id);
  const more = [...all.slice(i + 1), ...all.slice(0, i)]
    .filter((l) => !sameStreet(l, listing))
    .slice(0, MORE_LISTINGS);
  if (more.length === 0) return null;
  const section = SECTIONS[listing.section];
  return (
    <section className="section section-white">
      <div className="wrap">
        <SectionHead
          eyebrow={section.eyebrow}
          title={MORE_TITLE[listing.section]}
          action={
            <a href={section.path} className="btn btn-outline-dark">
              See them all <Icon name="arrow" />
            </a>
          }
        />
        <ul className="listing-grid">
          {more.map((l) => (
            <ListingCard key={l.id} listing={l} allCommercial={listing.section === 'commercial'} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Photos shown straight away under the main one; the rest sit behind
 *  "Show all photos". */
const GRID_PHOTOS = 4;

/** A swipe at least this far across (px) moves to the next photo. */
const SWIPE = 50;

/** Every photo full size, one at a time, with previous and next buttons,
 *  arrow keys and swipe. A modal <dialog> keeps focus inside it and
 *  closes on Escape. */
function Gallery({
  listing,
  alt,
  index,
  onChange,
  onClose,
}: {
  listing: ListingData;
  alt: (i: number) => string;
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const photos = listing.photos!;
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);
  const count = photos.length;
  const go = (step: number) => onChange((index + step + count) % count);

  useEffect(() => {
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Fetch the photos either side, so moving on shows them straight away:
  // the same srcset and sizes as the gallery image, so a phone fetches
  // the 800px copy rather than the full-size one.
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      const j = (i + count) % count;
      const img = new Image();
      img.sizes = '100vw';
      img.srcset = photoSrcSet(listing, j) ?? '';
      img.src = photos[j];
    });
  }, [index]);

  return (
    <dialog
      ref={dialog}
      className="gallery"
      aria-label={`Photos of ${listingAddress(listing)}`}
      onClose={onClose}
      // A click on the dark backdrop (the dialog itself, not its contents)
      // closes it.
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      onTouchStart={(e) => (swipeStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (swipeStart.current === null) return;
        const dx = e.changedTouches[0].clientX - swipeStart.current;
        swipeStart.current = null;
        if (Math.abs(dx) >= SWIPE) go(dx < 0 ? 1 : -1);
      }}
    >
      <p className="gallery__count" aria-live="polite">
        {index + 1} / {count}
      </p>
      <button type="button" className="gallery__close" aria-label="Close photos" onClick={() => dialog.current?.close()}>
        <Icon name="close" size={26} />
      </button>
      <img
        key={photos[index]}
        className="gallery__img"
        src={photos[index]}
        srcSet={photoSrcSet(listing, index)}
        sizes="100vw"
        alt={alt(index)}
        decoding="async"
      />
      {count > 1 && (
        <>
          <button type="button" className="gallery__nav gallery__nav--prev" aria-label="Previous photo" onClick={() => go(-1)}>
            <Icon name="prev" size={28} />
          </button>
          <button type="button" className="gallery__nav gallery__nav--next" aria-label="Next photo" onClick={() => go(1)}>
            <Icon name="next" size={28} />
          </button>
        </>
      )}
    </dialog>
  );
}

function Photos({ listing, address }: { listing: ListingData; address: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = listing.photos ?? [];
  if (photos.length === 0) return null;
  const alt = (i: number) => `${address}, photo ${i + 1} of ${photos.length}`;
  // Each photo links to its full-size file, which is what opens without
  // JavaScript; with it, the link opens the gallery at that photo.
  const show = (i: number) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setOpen(i);
  };
  // Thumbnails: the 400px copies, or the 800px ones on high-density
  // screens. Every photo is shown cropped to 3:2 (index.css), so the
  // width and height only give that shape before it loads.
  const tile = (i: number) => (
    <li key={photos[i]}>
      <a href={photos[i]} onClick={show(i)}>
        <img
          src={thumb(listing, i)}
          srcSet={tileSrcSet(listing, i)}
          sizes="(max-width: 760px) 50vw, 300px"
          width={600}
          height={400}
          alt={alt(i)}
          loading="lazy"
          decoding="async"
        />
      </a>
    </li>
  );
  const rest = photos.map((_, i) => i).slice(1);
  return (
    <div className="listing-photos">
      <a href={photos[0]} onClick={show(0)} className="listing-photos__open">
        {/* The page's largest image (its LCP), so it's fetched first, and
            preloaded in the page's head with the same srcset and sizes
            (scripts/routes.mjs). React 18 doesn't know fetchPriority yet;
            the lowercase attribute passes straight through (as in
            Picture). */}
        <img
          className="listing-photos__main"
          src={photos[0]}
          srcSet={mainPhotoSrcSet(listing)}
          sizes={MAIN_PHOTO_SIZES}
          width={1500}
          height={1000}
          alt={alt(0)}
          decoding="async"
          {...{ fetchpriority: 'high' }}
        />
        {photos.length > 1 && (
          <span className="listing-photos__badge" aria-hidden="true">
            View all {photos.length} photos
          </span>
        )}
      </a>
      {rest.length > 0 && <ul className="listing-photos__grid">{rest.slice(0, GRID_PHOTOS).map(tile)}</ul>}
      {rest.length > GRID_PHOTOS && (
        <details className="listing-photos__more">
          <summary>Show all {photos.length} photos</summary>
          <ul className="listing-photos__grid">{rest.slice(GRID_PHOTOS).map(tile)}</ul>
        </details>
      )}
      {open !== null && (
        <Gallery listing={listing} alt={alt} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

/** An email address that can wrap after the "@" and before its ending
 *  (".com.au"), never mid-word, in the narrow agent box. One <span>, so
 *  inside the agent box's flex links it's a single item that wraps as
 *  text: loose, each part and <wbr> became an item of its own, squeezed
 *  side by side and broken mid-word on phones. */
function EmailText({ email }: { email: string }) {
  const at = email.indexOf('@');
  const dot = email.indexOf('.', at);
  if (at < 0 || dot < 0) return <span className="listing__email">{email}</span>;
  return (
    <span className="listing__email">
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1, dot)}
      <wbr />
      {email.slice(dot)}
    </span>
  );
}

type LinkTargets = Record<string, string> | undefined;

/** Text with its web and email addresses as links. A web address shows
 *  as what it is ("Watch the video", "realestate.com.au"; linkLabel in
 *  src/lib/description.ts), and a short link goes straight to its target
 *  when the build has looked it up. */
function Linked({ text, targets }: { text: string; targets: LinkTargets }) {
  return (
    <>
      {linkParts(text, targets).map((part, i) =>
        part.href ? (
          <a
            key={i}
            href={part.href}
            title={part.title}
            {...(/^(mailto|tel):/.test(part.href) ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {part.href.startsWith('mailto:') ? <EmailText email={part.text} /> : part.text}
          </a>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

/** A Google map of the listing, and a link to open it in Google Maps.
 *  Only when the street address is shown: an agent who hides it in
 *  PropertyMe doesn't want the property pinpointed. Google's plain embed
 *  needs no API key.
 *
 *  The map only loads when asked for ("Show map"). Even with
 *  loading="lazy" the embed pulled in about 470 KB of Google's scripts
 *  straight away on slow phones, competing with the main photo, and most
 *  visitors never look at it. Until then it's a plain box with the
 *  address, the same on the server and in the browser so the prerendered
 *  page hydrates cleanly, and Google isn't contacted at all (the privacy
 *  policy covers these and the office pages' maps). */
function ListingMap({ listing, address }: { listing: ListingData; address: string }) {
  const [shown, setShown] = useState(false);
  if (!listing.street) return null;
  const query = encodeURIComponent([listing.street, listing.suburb, listing.state, listing.postcode].filter(Boolean).join(' '));
  return (
    <div className="listing__map">
      <h2 className="h-3">Location</h2>
      {shown ? (
        <iframe
          title={`Map of ${address}`}
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="listing__map-placeholder">
          <Icon name="pin" size={28} />
          <p>
            {listing.street}, {[listing.suburb, listing.state, listing.postcode].filter(Boolean).join(' ')}
          </p>
          <button type="button" className="btn btn-dark" onClick={() => setShown(true)}>
            Show map
          </button>
        </div>
      )}
      <p>
        <a href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer">
          <Icon name="pin" /> Open in Google Maps
        </a>
      </p>
    </div>
  );
}

/** The feed's plain-text description, with the headings, lists and
 *  paragraphs read back out of it (src/lib/description.ts). */
function Description({ text, price, targets }: { text: string; price: string; targets: LinkTargets }) {
  return (
    <div className="listing__description">
      {descriptionBlocks(text, price).map((block, i) => {
        if (block.type === 'heading') return <h3 key={i}>{block.text}</h3>;
        if (block.type === 'list') {
          return (
            <ul key={i}>
              {block.items.map((item, j) => {
                const labelled = splitLabel(item);
                return (
                  <li key={j}>
                    {labelled ? (
                      <>
                        <strong>{labelled.label}</strong> <Linked text={labelled.rest} targets={targets} />
                      </>
                    ) : (
                      <Linked text={item} targets={targets} />
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <Linked text={line} targets={targets} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

const SCHEMA = 'https://schema.org/';

/** A listing's price for structured data, from the text the page shows:
 *  one figure as `price`, a range ("$495,500 – $549,000") as min and max,
 *  and nothing for words alone ("Contact agent", "Auction"). Rents are per
 *  week unless the text says otherwise. */
function priceSpec(listing: ListingData): Record<string, unknown> | undefined {
  const amounts = dollarAmounts(listing.price);
  if (amounts.length === 0 || amounts.length > 2) return undefined;
  const value =
    amounts.length === 2 ? { minPrice: Math.min(...amounts), maxPrice: Math.max(...amounts) } : { price: amounts[0] };
  const forRent = listing.section === 'rent' || listing.section === 'commercial';
  if (!forRent && amounts.length === 1) return { price: amounts[0], priceCurrency: 'AUD' };
  if (!forRent) return { priceSpecification: { '@type': 'PriceSpecification', ...value, priceCurrency: 'AUD' } };
  // Commercial rents are often a year's; a home's is a week's.
  const text = listing.price.toLowerCase();
  const unit = /month|\bp\.?c\.?m\b/.test(text)
    ? 'month'
    : /annum|year|annual|\bp\.?a\b/.test(text)
      ? 'year'
      : /week|\bp\.?w\b/.test(text) || listing.section === 'rent'
        ? 'week'
        : undefined;
  return {
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      ...value,
      priceCurrency: 'AUD',
      ...(unit ? { unitText: unit } : {}),
    },
  };
}

/** "180 m²" → square metres, for floorSize. */
function squareMetres(area: string | undefined): number | undefined {
  const m = area?.match(/^([\d,.]+)\s*m²$/);
  return m ? Number.parseFloat(m[1].replace(/,/g, '')) : undefined;
}

/** The listing as schema.org's RealEstateListing (a page about a property
 *  on the market): the offer (price, sale or lease, and whether it's
 *  still available), when it was last updated, and the property itself
 *  under `about`, with its address and rooms. Only what the feed says: a
 *  hidden street address stays out, and so does a price given in words. */
function listingJsonLd(listing: ListingData, path: string, address: string) {
  const forRent = listing.section === 'rent' || listing.section === 'commercial';
  const home = listing.propertyType !== 'commercial' && !/^(land|rural|commercial)$/i.test(listing.category);
  const floorSize = squareMetres(listing.buildingArea);
  const summary = listing.description ? descriptionSummary(listing.description, listing.price) : '';
  const availability =
    listing.section === 'sold'
      ? 'SoldOut'
      : listing.underOffer || listing.price === 'Under contract'
        ? 'LimitedAvailability'
        : 'InStock';
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    url: `${SITE}${path}`,
    name: listing.headline || address,
    ...(listing.photos?.length ? { image: listing.photos.map((src) => (src.startsWith('/') ? SITE + src : src)) } : {}),
    ...(summary ? { description: summary } : {}),
    ...(listing.modified ? { datePosted: listing.modified.slice(0, 10) } : {}),
    offers: {
      '@type': 'Offer',
      ...(forRent ? { businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut' } : {}),
      ...priceSpec(listing),
      availability: SCHEMA + availability,
    },
    about: {
      // A home is an Accommodation, which has rooms and a floor size;
      // land and commercial space are just a Place, with an address.
      '@type': home ? 'Accommodation' : 'Place',
      name: address,
      address: {
        '@type': 'PostalAddress',
        ...(listing.street ? { streetAddress: listing.street } : {}),
        ...(listing.suburb ? { addressLocality: listing.suburb } : {}),
        addressRegion: listing.state || 'SA',
        ...(listing.postcode ? { postalCode: listing.postcode } : {}),
        addressCountry: 'AU',
      },
      ...(home && listing.bedrooms ? { numberOfBedrooms: listing.bedrooms } : {}),
      ...(home && listing.bathrooms ? { numberOfBathroomsTotal: listing.bathrooms } : {}),
      ...(home && floorSize ? { floorSize: { '@type': 'QuantitativeValue', value: floorSize, unitCode: 'MTK' } } : {}),
    },
  };
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
    ['Available', listing.availableNow ? 'Now' : listing.availableFrom && `From ${formatDay(listing.availableFrom)}`],
    ['Bond', listing.bond],
    ['Sold on', listing.soldDate && formatDay(listing.soldDate)],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  return (
    <Layout>
      <JsonLd data={listingJsonLd(listing, path, address)} />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: section.name, path: section.path },
          { name: address, path },
        ])}
      />
      <PageHero
        eyebrow={`${section.eyebrow} · ${listing.category}`}
        // Street and suburb, so the heading says where it is on its own.
        title={address}
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
              {listing.description && <Description text={listing.description} price={listing.price} targets={listing.linkTargets} />}
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
              <ListingMap listing={listing} address={address} />
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
                          <Icon name="clock" /> {formatInspection(time)}
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
                      // The feed only has some agents' numbers; the team
                      // page's verified one fills the gap.
                      const phone = agent.phone ?? member?.phone;
                      return (
                        <li key={agent.name}>
                          {member ? (
                            <a href={`/our-people/${teamMemberId(member.name)}/`} className="listing__agent-name">
                              {agent.name}
                            </a>
                          ) : (
                            <span className="listing__agent-name">{agent.name}</span>
                          )}
                          {phone && (
                            <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                              <Icon name="phone" /> {phone}
                            </a>
                          )}
                          {agent.email && (
                            <a href={`mailto:${agent.email}`}>
                              <Icon name="mail" /> <EmailText email={agent.email} />
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

      <MoreListings listing={listing} />

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
