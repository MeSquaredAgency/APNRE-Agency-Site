// /buy/, /rent/, /sold/ and /commercial/. Each shows its listings from
// PropertyMe's feed (src/lib/listings.ts), linking to a page per property.
// Until the feed is set up (docs/listings-feed.md), or when a section has
// nothing in it, /buy/, /rent/ and /sold/ point to APN's
// realestate.com.au profile instead, which is always current.

import { useState } from 'react';
import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import { CtaBand, FormSection, PageHero, PortalLinks, SectionHead } from '../components/sections';
import { LISTINGS_LINKS } from '../data/nav';
import { BLAIR_ATHOL_PHOTOS } from '../data/offices';
import { suppliedPhoto } from '../data/supplied';
import { OFFICE_RENT_FROM } from '../data/office-space';
import { listingsIn, thumb, type Listing, type ListingSection } from '../lib/listings';
import mountGambier from '../assets/photos/mount-gambier-hillside-street.jpg?photo';
import interior from '../assets/photos/interior-corner-windows.jpg?photo';
import soldSign from '../assets/photos/sold-sign-ridley.jpg?photo';

interface ListingsPanelProps {
  link: { href: string; label: string };
  title: string;
  copy: string;
}

function ListingsPanel({ link, title, copy }: ListingsPanelProps) {
  return (
    <section className="section section-white">
      <div className="wrap listings-panel">
        <div>
          <h2 className="h-1">{title}</h2>
          <p className="lede">{copy}</p>
        </div>
        <a href={link.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          {link.label} <Icon name="external" />
        </a>
      </div>
      <div className="wrap">
        <PortalLinks />
      </div>
    </section>
  );
}

/** Bedrooms, bathrooms and car spaces, read out in full by screen readers. */
export function ListingFeatures({ listing }: { listing: Listing }) {
  const items = [
    { icon: 'bed', n: listing.bedrooms, label: 'bedroom' },
    { icon: 'bath', n: listing.bathrooms, label: 'bathroom' },
    { icon: 'car', n: listing.carSpaces, label: 'car space' },
  ] as const;
  const shown = items.filter((item) => item.n);
  if (shown.length === 0) return null;
  return (
    <ul className="listing-features">
      {shown.map((item) => (
        <li key={item.icon}>
          <Icon name={item.icon} />
          {item.n}
          <span className="visually-hidden">
            {' '}
            {item.label}
            {item.n === 1 ? '' : 's'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  const photo = thumb(listing, 0);
  const badges = [
    listing.underOffer ? 'Under offer' : listing.section === 'sold' ? 'Sold' : '',
    // Everything on /commercial/ is commercial, so it needs no badge there.
    listing.propertyType === 'commercial' && listing.section !== 'commercial' ? 'Commercial' : '',
  ].filter(Boolean);
  return (
    <li>
      {/* Blair Athol's offices have no page of their own: they're on
          /office-space/, with the floor plan and request form. */}
      <a className="listing-card" href={listing.apnBuilding === 'blair-athol' ? '/office-space/#listed' : listing.path}>
        <div className="listing-card__photo">
          {photo ? (
            // The address beside it says what the property is, so the
            // photo itself is decorative here.
            <img src={photo} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="listing-card__no-photo">Photos coming soon</span>
          )}
          {badges.length > 0 && (
            <span className="listing-card__badges">
              {badges.map((b) => (
                <span key={b} className={`listing-card__badge${b === 'Commercial' ? ' listing-card__badge--commercial' : ''}`}>
                  {b}
                </span>
              ))}
            </span>
          )}
        </div>
        <div className="listing-card__body">
          <p className="listing-card__price">
            {/* PropertyMe's price line for these is a description ("Shared
                Office Spaces - Private Rooms"); /office-space/'s own price
                is clearer. */}
            {listing.apnBuilding === 'blair-athol' ? `From $${OFFICE_RENT_FROM} a week incl. GST` : listing.price}
          </p>
          <h3 className="listing-card__address">{listing.street ?? listing.suburb}</h3>
          <p className="listing-card__meta">
            {[listing.street ? listing.suburb : '', listing.category].filter(Boolean).join(' · ')}
          </p>
          <ListingFeatures listing={listing} />
        </div>
      </a>
    </li>
  );
}

interface ListingsGridProps {
  section: ListingSection;
  link: { href: string; label: string };
  eyebrow: string;
  /** e.g. n => `${n} properties for sale.` */
  title: (n: number) => string;
  /** The page's usual copy, shown when the section is empty. */
  fallback: { title: string; copy: string };
  /** Residential / Commercial chips, shown when there's some of each. */
  filterable?: boolean;
}

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number]['key'];

/** The section's listings, or the realestate.com.au panel when there are none. */
function ListingsGrid({ section, link, eyebrow, title, fallback, filterable = false }: ListingsGridProps) {
  const [type, setType] = useState<TypeFilter>('all');
  const listings = listingsIn(section);
  if (listings.length === 0) return <ListingsPanel link={link} {...fallback} />;
  const commercialCount = listings.filter((l) => l.propertyType === 'commercial').length;
  const showFilter = filterable && commercialCount > 0 && commercialCount < listings.length;
  const shown = listings.filter(
    (l) => type === 'all' || (l.propertyType ?? 'residential') === type,
  );
  return (
    <section className="section section-white">
      <div className="wrap">
        <SectionHead eyebrow={eyebrow} title={title(listings.length)} />
        {showFilter && (
          <>
            <div className="chips listing-filter" role="group" aria-label="Filter by property type">
              {TYPE_FILTERS.map((f) => (
                <button
                  type="button"
                  key={f.key}
                  className="chip"
                  aria-pressed={type === f.key}
                  onClick={() => setType(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="visually-hidden" role="status">
              {shown.length === 1 ? 'Showing 1 property' : `Showing ${shown.length} properties`}
            </p>
          </>
        )}
        <ul className="listing-grid">
          {shown.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </ul>
        <PortalLinks />
      </div>
    </section>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function Buy() {
  return (
    <Layout>
      <PageHero
        eyebrow="Buy"
        title="Properties for sale."
        lede="Homes, land and investment properties across Adelaide and Mount Gambier."
        photo={mountGambier}
        photoAlt="Homes on a hillside street in Mount Gambier"
        focalPoint="30% 65%"
      />
      <ListingsGrid
        section="buy"
        link={LISTINGS_LINKS.buy}
        eyebrow="On the market"
        title={(n) => `${plural(n, 'property', 'properties')} for sale.`}
        filterable
        fallback={{
          title: 'See everything we have on the market.',
          copy: 'Our current listings, with photos, inspection times and price guides, are on our realestate.com.au agency page.',
        }}
      />
      <FormSection
        id="register"
        eyebrow="Buyer list"
        title="Hear about new listings."
        copy="Tell us what you’re looking for and our sales team will let you know when something suitable comes up."
      >
        <EnquiryForm kind="buyer-register" submitLabel="Join the Buyer List" />
      </FormSection>
      <CtaBand
        title="Selling before you buy?"
        copy="Find out what your current property is worth with a free, no-obligation appraisal."
        href="/appraisal/sales/"
        label="Book a Sales Appraisal"
      />
    </Layout>
  );
}

/** The better hero photo asked for in the director's review, once it's
 *  added (src/data/supplied.ts). */
const RENT_HERO = suppliedPhoto('rent-hero');

export function Rent() {
  return (
    <Layout>
      <PageHero
        eyebrow="Rent"
        title="Properties for rent."
        lede="Rental homes available now across Adelaide and Mount Gambier."
        photo={RENT_HERO?.photo ?? interior}
        photoAlt={RENT_HERO ? RENT_HERO.alt : 'Floor-to-ceiling corner windows in a rental property managed by APN'}
      />
      <ListingsGrid
        section="rent"
        link={LISTINGS_LINKS.rent}
        eyebrow="Available now"
        title={(n) => `${plural(n, 'property', 'properties')} for rent.`}
        fallback={{
          title: 'See what’s available to rent.',
          copy: 'Our current rentals, with photos and inspection times, are on our realestate.com.au agency page. Apply through the listing.',
        }}
      />
      <FormSection
        id="register"
        eyebrow="Can’t see the right one?"
        title="Tell us what you need."
        copy="Let us know what you’re looking for and our property management team will get in touch if something suitable comes up."
      >
        <EnquiryForm kind="tenant-register" submitLabel="Get Rental Alerts" />
      </FormSection>
      <CtaBand
        title="Already renting with APN?"
        copy="Report a repair or maintenance issue with your rental property."
        href="/client-hub/tenants/#repairs"
        label="Report a Repair"
      />
    </Layout>
  );
}

export function Sold() {
  return (
    <Layout>
      <PageHero
        eyebrow="Sold"
        title="Recently sold."
        lede="Properties APN has recently sold across Adelaide and Mount Gambier."
        photo={soldSign}
        photoAlt="An Adelaide Property Network SOLD sign outside a brick home"
        focalPoint="70% center"
      />
      <ListingsGrid
        section="sold"
        link={LISTINGS_LINKS.sold}
        eyebrow="Recent results"
        title={(n) => (n === 1 ? 'Our latest sale.' : `Our latest ${n} sales.`)}
        fallback={{
          title: 'See our recent results.',
          copy: 'Our sold properties are listed on our realestate.com.au agency page.',
        }}
      />
      <CtaBand
        title="What could yours sell for?"
        copy="Book a free sales appraisal and we’ll walk you through recent comparable sales near you."
        href="/appraisal/sales/"
        label="Book a Sales Appraisal"
      />
    </Layout>
  );
}

/** Every lease that isn't a home: offices, shops and other commercial
 *  space, including the offices in APN's own buildings (Blair Athol's
 *  cards link to /office-space/). */
export function Commercial() {
  const listings = listingsIn('commercial');
  return (
    <Layout>
      <PageHero
        eyebrow="Commercial"
        title="Commercial property for lease."
        lede="Offices, shops and other commercial space across Adelaide and Mount Gambier."
        photo={BLAIR_ATHOL_PHOTOS.meetingRoom.photo}
        photoAlt={BLAIR_ATHOL_PHOTOS.meetingRoom.alt}
      />
      {listings.length > 0 ? (
        <section className="section section-white">
          <div className="wrap">
            <SectionHead
              eyebrow="Available now"
              title={`${plural(listings.length, 'commercial property', 'commercial properties')} for lease.`}
            />
            <ul className="listing-grid">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="section section-white">
          <div className="wrap listings-panel">
            <div>
              <h2 className="h-1">Nothing listed right now.</h2>
              <p className="lede">
                Tell us what kind of space you’re after and we’ll let you know when something suitable comes up.
              </p>
            </div>
            <a href="#enquire" className="btn btn-primary">
              Tell Us What You Need <Icon name="arrow" />
            </a>
          </div>
        </section>
      )}
      <FormSection
        id="enquire"
        eyebrow="Looking for space?"
        title="Tell us what you need."
        copy="Let us know the kind of space, the size and the area you’re after, and our team will be in touch."
      >
        <EnquiryForm kind="general" submitLabel="Send Enquiry" defaultTopic="Commercial leasing" />
      </FormSection>
      <CtaBand
        title="Need an office of your own?"
        copy={`Private offices in our Blair Athol building, from $${OFFICE_RENT_FROM} a week including GST.`}
        href="/office-space/"
        label="See Office Space"
      />
    </Layout>
  );
}
