// One page per office, at /adelaide/ and /mount-gambier/: where it is,
// when it's open, who works there and what they look after. Each office
// is its own page id in routes.json (office-adelaide, office-mount-gambier)
// so each gets its own link-preview image. Mount Gambier's Google Business
// Profile should link to /mount-gambier/, so people looking for that
// office land on a page about it rather than the Adelaide home page.
//
// Only what offices.ts and team.ts hold: no invented history or figures.

import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import type { ReactNode } from 'react';
import { Actions, ClosureNote, FormSection, PageHero, ProseSection, Team, type Action } from '../components/sections';
import { OPENING_HOURS, PHONE_TEL, WHATSAPP_URL } from '../data/business';
import { OFFICES, type OfficeId } from '../data/offices';
import { suppliedPhoto } from '../data/supplied';
import { TEAM } from '../data/team';
import type { Photo } from '../lib/photo';
import { trackCallClick, trackWhatsAppClick } from '../lib/analytics';
import { breadcrumbList } from '../structured-data';
import mountGambierStreet from '../assets/photos/mount-gambier-hillside-street.jpg?photo';

interface OfficePageConfig {
  path: string;
  /** Above the heading: the office and its postcode. */
  eyebrow: string;
  /** The page's h1: where the office is, suburb first. */
  title: string;
  /** "Our Blair Athol office", over the address. */
  detailsTitle: string;
  photo: Photo;
  photoAlt: string;
  focalPoint?: string;
  actions: Action[];
  actionsTitle: string;
  /** What the office does for landlords, with links to the service pages. */
  services: { eyebrow: string; title: string; body: ReactNode };
}

const MOUNT_GAMBIER_PHOTO = suppliedPhoto('mount-gambier-office');

const CONFIG: Record<OfficeId, OfficePageConfig> = {
  adelaide: {
    path: '/adelaide/',
    eyebrow: 'Adelaide office · Blair Athol SA 5084',
    title: 'Real estate in Blair Athol, Adelaide.',
    detailsTitle: 'Our Blair Athol office',
    photo: OFFICES.adelaide.photo!,
    photoAlt: OFFICES.adelaide.photoAlt,
    actions: [
      { icon: 'chart', title: 'Get a sales appraisal', copy: 'A realistic price guide based on recent sales nearby.', href: '/appraisal/sales/' },
      { icon: 'key', title: 'Property management', copy: 'How we look after Adelaide landlords and their tenants.', href: '/leasing/' },
      { icon: 'home', title: 'Properties for sale and rent', copy: 'Current listings, with photos and inspection times.', href: '/buy/' },
      { icon: 'tag', title: 'Office space for lease', copy: 'Offices and a podcast room in this building.', href: '/office-space/' },
    ],
    actionsTitle: 'How we can help in Adelaide.',
    // TODO(adelaide-suburbs): name the suburbs the Adelaide property
    // managers cover once APN confirms the list; don't guess it.
    services: {
      eyebrow: 'Property management',
      title: 'Property management in Adelaide’s northern suburbs.',
      body: (
        <>
          <p className="lede">
            Our Adelaide property managers work from Blair Athol, on Main North Road, and look after landlords and
            tenants across Adelaide’s northern suburbs.
          </p>
          <p>
            <a href="/our-people/brett-david/">Brett David</a>, our Region Manager for Adelaide, looks after leasing and
            accounts. You’ll know who is responsible for your property and how to reach them directly.
          </p>
          <p>
            See <a href="/leasing/">how we manage properties</a>, get a{' '}
            <a href="/appraisal/rental/">free rental appraisal</a>, read{' '}
            <a href="/blog/what-does-a-property-manager-do/">what a property manager does</a>, or find out{' '}
            <a href="/leasing/switching-property-managers/">how switching property managers works</a>.
          </p>
        </>
      ),
    },
  },
  'mount-gambier': {
    path: '/mount-gambier/',
    eyebrow: 'Mount Gambier office · SA 5290',
    title: 'Real estate in Mount Gambier.',
    detailsTitle: 'Our Mount Gambier office',
    // The office itself once it's supplied (src/data/supplied.ts); until
    // then a Mount Gambier street, so the page doesn't show Adelaide.
    photo: MOUNT_GAMBIER_PHOTO?.photo ?? mountGambierStreet,
    photoAlt: MOUNT_GAMBIER_PHOTO?.alt ?? 'Homes on a hillside street in Mount Gambier',
    focalPoint: MOUNT_GAMBIER_PHOTO ? undefined : '30% 65%',
    actions: [
      { icon: 'chart', title: 'Get a rental appraisal', copy: 'What your Mount Gambier property should lease for today.', href: '/mount-gambier/rental-appraisal/' },
      { icon: 'key', title: 'Property management', copy: 'How we look after Mount Gambier landlords and their tenants.', href: '/mount-gambier/property-management/' },
      { icon: 'home', title: 'Commercial property', copy: 'Offices, shops and other space for lease, with photos.', href: '/commercial/' },
      { icon: 'tag', title: 'Thinking of selling?', copy: 'Book a free sales appraisal.', href: '/appraisal/sales/' },
    ],
    actionsTitle: 'How we can help in Mount Gambier.',
    services: {
      eyebrow: 'Property management',
      title: 'Property management in Mount Gambier.',
      body: (
        <>
          <p className="lede">
            Mount Gambier landlords are looked after from this office by{' '}
            <a href="/our-people/luke-whittaker/">Luke Whittaker</a>, our Region Manager for Mount Gambier, and{' '}
            <a href="/our-people/jenny-saffin/">Jenny Saffin</a>, a licensed property manager.
          </p>
          <p>
            You’ll know who is responsible for your property and how to reach them directly. Luke’s work also spans
            commercial sales and leasing.
          </p>
          <p>
            See <a href="/mount-gambier/property-management/">property management in Mount Gambier</a>, get a{' '}
            <a href="/mount-gambier/rental-appraisal/">free Mount Gambier rental appraisal</a>, read{' '}
            <a href="/blog/what-does-a-property-manager-do/">what a property manager does</a>, or find out{' '}
            <a href="/leasing/switching-property-managers/">how switching property managers works</a>.
          </p>
        </>
      ),
    },
  },
};

function OfficePage({ id }: { id: OfficeId }) {
  const office = OFFICES[id];
  const c = CONFIG[id];
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapsQuery)}`;
  const team = TEAM.filter((m) => m.office === id).map((m) => m.name);

  return (
    <Layout>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact/' },
          { name: office.name, path: c.path },
        ])}
      />
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={office.about}
        photo={c.photo}
        photoAlt={c.photoAlt}
        focalPoint={c.focalPoint}
      >
        <div className="page-hero__actions">
          <a href={PHONE_TEL} className="btn btn-primary" onClick={() => trackCallClick(`office_page_${id}`)}>
            <Icon name="phone" /> {office.phone}
          </a>
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
            <Icon name="pin" /> Get Directions
          </a>
          <a href="#enquiry" className="btn btn-outline-light">
            Send an Enquiry
          </a>
        </div>
      </PageHero>

      <section className="section section-paper">
        <div className="wrap office-page">
          <div className="office-page__details">
            <span className="eyebrow">Visit us</span>
            <h2 className="h-2">{c.detailsTitle}</h2>
            <p className="office-card__address">
              {office.addressLines[0]}
              <br />
              {office.addressLines[1]}
            </p>
            <p className="office-card__hours">
              <Icon name="clock" />
              <span aria-hidden="true">{OPENING_HOURS.display}</span>
              <span className="visually-hidden">{OPENING_HOURS.spoken}</span>
            </p>
            <ClosureNote repairs />
            <div className="office-card__links">
              <a href={PHONE_TEL} onClick={() => trackCallClick(`office_page_${id}_details`)}>
                <Icon name="phone" /> {office.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick(`office_page_${id}`)}>
                <Icon name="whatsapp" /> WhatsApp Us
              </a>
              <a href={directions} target="_blank" rel="noopener noreferrer">
                <Icon name="pin" /> Get directions
              </a>
            </div>
          </div>
          {/* Loads only when scrolled to; see ListingMap in Listing.tsx. */}
          <iframe
            className="office-page__map"
            title={`Map of the ${office.name} office`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(office.mapsQuery)}&output=embed`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>

      <ProseSection eyebrow={c.services.eyebrow} title={c.services.title}>
        {c.services.body}
      </ProseSection>
      <Actions items={c.actions} eyebrow="Quick actions" title={c.actionsTitle} />
      {team.length > 0 && <Team names={team} eyebrow="Our people" title={`The ${office.name} team.`} />}
      <FormSection
        id="enquiry"
        eyebrow="Send an enquiry"
        title={`Get in touch with ${office.name}.`}
        copy="Tell us a little about what you need and the right person will get back to you."
      >
        <EnquiryForm kind="general" submitLabel="Send Enquiry" defaultOffice={id} />
      </FormSection>
    </Layout>
  );
}

export const AdelaideOffice = () => <OfficePage id="adelaide" />;
export const MountGambierOffice = () => <OfficePage id="mount-gambier" />;
