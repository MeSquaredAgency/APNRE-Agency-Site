import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import { FormSection, PageHero } from '../components/sections';
import { MAINTENANCE_FORM_ENABLED, PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { LISTINGS_LINKS } from '../data/nav';
import { STOCK } from '../data/media';
import { trackCallClick } from '../lib/analytics';

// For existing clients. The repairs form only appears once
// MAINTENANCE_FORM_ENABLED is switched on in src/data/business.ts; until
// then, tenants are told to call. If APN's property management software
// has landlord/tenant portals, link them from the two hub cards.

interface HubCardProps {
  id: string;
  kicker: string;
  title: string;
  copy: string;
  links: { href: string; label: string; external?: boolean }[];
}

function HubCard({ id, kicker, title, copy, links }: HubCardProps) {
  return (
    <article className="hub-card" id={id}>
      <span className="eyebrow">{kicker}</span>
      <h2 className="h-2">{title}</h2>
      <p>{copy}</p>
      <ul className="hub-card__links">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {l.label} <Icon name={l.external ? 'external' : 'arrow'} size={16} />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Hub() {
  return (
    <Layout>
      <PageHero
        eyebrow="Client hub"
        title="For our landlords and tenants."
        lede="Get in touch with your property manager, find a rental, or let us know something needs fixing."
        photo={STOCK.keysHand.photo}
        photoAlt={STOCK.keysHand.alt}
      />

      <section className="section section-white">
        <div className="wrap hub-grid">
          <HubCard
            id="landlords"
            kicker="Landlords"
            title="Landlord hub"
            copy="Questions about your property, statements or a tenancy? Your property manager is your first point of contact."
            links={[
              { href: PHONE_TEL, label: `Call ${PHONE_DISPLAY}` },
              { href: '/our-people/?filter=property-management', label: 'Find your property manager' },
              { href: '/appraisal/?type=rental', label: 'Rental appraisal for another property' },
              { href: '/leasing/', label: 'Our property management service' },
            ]}
          />
          <HubCard
            id="tenants"
            kicker="Tenants"
            title="Tenant hub"
            copy="Looking for a rental, or already renting with APN? Here’s where to start."
            links={[
              { href: LISTINGS_LINKS.rent.href, label: 'Current rentals', external: true },
              { href: '/rent/#register', label: 'Tell us what you’re looking for' },
              { href: '#repairs', label: 'Report a repair' },
              { href: '/contact/', label: 'Contact the office' },
            ]}
          />
        </div>
      </section>

      <section className="section section-paper" id="repairs">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="eyebrow">Report maintenance</span>
              <h2 className="h-1">Something needs fixing?</h2>
            </div>
          </div>
          <div className="notice-grid">
            <div className="notice notice--urgent">
              <h3 className="h-3">Urgent repairs</h3>
              <p>
                If something is unsafe or could cause serious damage, such as a
                burst pipe, a gas leak, no power or a security problem, call us
                straight away on{' '}
                <a href={PHONE_TEL} onClick={() => trackCallClick('hub_urgent')}>
                  {PHONE_DISPLAY}
                </a>
                . Don’t use a form for urgent repairs.
              </p>
              <p>
                <strong>If anyone is in danger, call 000 first.</strong>
              </p>
            </div>
            <div className="notice">
              <h3 className="h-3">Everything else</h3>
              <p>
                {MAINTENANCE_FORM_ENABLED
                  ? 'For non-urgent repairs, use the form below or contact your property manager. Include as much detail as you can.'
                  : `For non-urgent repairs, contact your property manager or call us on ${PHONE_DISPLAY}. Have the property address and a description of the problem ready.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {MAINTENANCE_FORM_ENABLED && (
        <FormSection
          id="request"
          eyebrow="Non-urgent repairs"
          title="Report a repair."
          copy="Tell us what’s wrong and where. Your property manager will be in touch to arrange it."
        >
          <EnquiryForm kind="maintenance" submitLabel="Send Repair Request" />
        </FormSection>
      )}
    </Layout>
  );
}
