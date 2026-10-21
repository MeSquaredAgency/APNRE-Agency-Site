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
import { FormSection, PageHero, Team } from '../components/sections';
import { OPENING_HOURS, PHONE_TEL, WHATSAPP_URL } from '../data/business';
import { OFFICES, type OfficeId } from '../data/offices';
import { suppliedPhoto } from '../data/supplied';
import { TEAM } from '../data/team';
import type { Photo } from '../lib/photo';
import { trackCallClick, trackWhatsAppClick } from '../lib/analytics';
import { breadcrumbList } from '../structured-data';
import { Actions, type Action } from './Hubs';
import mountGambierStreet from '../assets/photos/mount-gambier-hillside-street.jpg?photo';

interface OfficePageConfig {
  path: string;
  photo: Photo;
  photoAlt: string;
  focalPoint?: string;
  actions: Action[];
}

const MOUNT_GAMBIER_PHOTO = suppliedPhoto('mount-gambier-office');

const CONFIG: Record<OfficeId, OfficePageConfig> = {
  adelaide: {
    path: '/adelaide/',
    photo: OFFICES.adelaide.photo!,
    photoAlt: OFFICES.adelaide.photoAlt,
    actions: [
      { icon: 'chart', title: 'Get a sales appraisal', copy: 'A realistic price guide based on recent sales nearby.', href: '/appraisal/sales/' },
      { icon: 'key', title: 'Property management', copy: 'How we look after Adelaide landlords and their tenants.', href: '/leasing/' },
      { icon: 'home', title: 'Properties for sale and rent', copy: 'Current listings, with photos and inspection times.', href: '/buy/' },
      { icon: 'tag', title: 'Office space for lease', copy: 'Offices and a podcast room in this building.', href: '/office-space/' },
    ],
  },
  'mount-gambier': {
    path: '/mount-gambier/',
    // The office itself once it's supplied (src/data/supplied.ts); until
    // then a Mount Gambier street, so the page doesn't show Adelaide.
    photo: MOUNT_GAMBIER_PHOTO?.photo ?? mountGambierStreet,
    photoAlt: MOUNT_GAMBIER_PHOTO?.alt ?? 'Homes on a hillside street in Mount Gambier',
    focalPoint: MOUNT_GAMBIER_PHOTO ? undefined : '30% 65%',
    actions: [
      { icon: 'chart', title: 'Get a rental appraisal', copy: 'What your Mount Gambier property should lease for today.', href: '/appraisal/rental/' },
      { icon: 'key', title: 'Property management', copy: 'How we look after landlords and their tenants.', href: '/leasing/' },
      { icon: 'home', title: 'Find a rental', copy: 'Current rentals, with photos and inspection times.', href: '/rent/' },
      { icon: 'tag', title: 'Thinking of selling?', copy: 'Book a free sales appraisal.', href: '/appraisal/sales/' },
    ],
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
        eyebrow={`${office.name} office`}
        title={`Real estate in ${office.name}.`}
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
            <h2 className="h-2">{office.name}</h2>
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

      <Actions items={c.actions} />
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
