// The client hubs: an overview at /client-hub/, and one page each for
// landlords, tenants, sellers and buyers. Each hub is the "I'm already
// dealing with APN (or about to), what do I do?" page for that audience:
// quick actions, the team they'll deal with, common questions and the
// right form.
//
// Keep answers to what APN can stand behind. No legal advice (notice
// periods, bond rules and so on), and no portals or payment methods
// unless APN confirms they exist.

import type { ReactNode } from 'react';
import Layout from '../components/Layout';
import EnquiryForm, { type EnquiryKind } from '../components/EnquiryForm';
import Icon, { type IconName } from '../components/Icon';
import JsonLd from '../components/JsonLd';
import { CtaBand, Faq, FormSection, ImageCards, PageHero, SectionHead, Team, type FaqItem } from '../components/sections';
import { MAINTENANCE_FORM_ENABLED, PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { LISTINGS_LINKS } from '../data/nav';
import { STOCK } from '../data/media';
import { breadcrumbList } from '../structured-data';
import type { TeamGroup } from '../data/team';
import type { Photo } from '../lib/photo';
import { trackCallClick } from '../lib/analytics';
import soldSign from '../assets/photos/sold-sign-ridley.jpg?photo';
import mountGambierStreet from '../assets/photos/mount-gambier-hillside-street.jpg?photo';

/* ---------- Building blocks ---------- */

interface Action {
  icon: IconName;
  title: string;
  copy: string;
  href: string;
  external?: boolean;
  /** Call-button placement name, for analytics, when href is the phone. */
  call?: string;
}

function Actions({ items }: { items: Action[] }) {
  return (
    <section className="section section-white">
      <div className="wrap">
        <SectionHead eyebrow="Quick actions" title="What do you need to do?" />
        <ul className="hub-actions">
          {items.map((a) => (
            <li key={a.title}>
              <a
                href={a.href}
                className="hub-action"
                onClick={a.call ? () => trackCallClick(a.call!) : undefined}
                {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="hub-action__icon">
                  <Icon name={a.icon} size={22} />
                </span>
                <span className="hub-action__title">
                  {a.title}
                  <Icon name={a.external ? 'external' : 'arrow'} size={16} />
                </span>
                <span className="hub-action__copy">{a.copy}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Urgent repairs first, then how to report everything else. */
function Repairs() {
  return (
    <section className="section section-paper" id="repairs">
      <div className="wrap">
        <SectionHead eyebrow="Repairs & maintenance" title="Something needs fixing?" />
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
                ? 'For non-urgent repairs, use the form below or contact your property manager. Include as much detail as you can, and photos if you can send them.'
                : `For non-urgent repairs, contact your property manager or call us on ${PHONE_DISPLAY}. Have the property address and a description of the problem ready.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface HubConfig {
  eyebrow: string;
  /** This hub's path, for the breadcrumb's structured data. */
  path: string;
  title: string;
  lede: string;
  photo: Photo;
  photoAlt: string;
  focalPoint?: string;
  actions: Action[];
  team: TeamGroup;
  teamTitle: string;
  /** Rendered after the team, e.g. the repairs section for tenants. */
  extra?: ReactNode;
  faqTitle: string;
  faqs: FaqItem[];
  /** Shown under the FAQs, e.g. links to a guide or service page. */
  faqMore?: ReactNode;
  form: {
    kind: EnquiryKind;
    eyebrow: string;
    title: string;
    copy: string;
    submit: string;
    topic?: string;
  };
}

function HubPage({ config: c }: { config: HubConfig }) {
  return (
    <Layout>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        lede={c.lede}
        photo={c.photo}
        photoAlt={c.photoAlt}
        focalPoint={c.focalPoint}
      >
        <nav className="hub-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/client-hub/">Client hub</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{c.eyebrow}</span>
        </nav>
      </PageHero>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Client hub', path: '/client-hub/' },
          { name: c.eyebrow, path: c.path },
        ])}
      />
      <Actions items={c.actions} />
      <Team group={c.team} eyebrow="Your team" title={c.teamTitle} />
      {c.extra}
      <Faq title={c.faqTitle} items={c.faqs} more={c.faqMore} />
      <FormSection id="enquiry" eyebrow={c.form.eyebrow} title={c.form.title} copy={c.form.copy}>
        <EnquiryForm kind={c.form.kind} submitLabel={c.form.submit} defaultTopic={c.form.topic} />
      </FormSection>
    </Layout>
  );
}

const CALL = { href: PHONE_TEL };

/* ---------- The four hubs ---------- */

export function LandlordHub() {
  return (
    <HubPage
      config={{
        eyebrow: 'Landlords',
        path: '/client-hub/landlords/',
        title: 'Landlord hub.',
        lede: 'For owners whose property APN Real Estate manages, or who are thinking about it: reach your property manager, get an appraisal, or talk to us about changing over.',
        photo: STOCK.openPlan.photo,
        photoAlt: STOCK.openPlan.alt,
        actions: [
          { icon: 'users', title: 'Talk to your property manager', copy: `Call ${PHONE_DISPLAY} and ask for them by name, or send a message below.`, ...CALL, call: 'hub_landlord' },
          { icon: 'chart', title: 'Get a rental appraisal', copy: 'What your property, or your next one, should lease for today.', href: '/appraisal/rental/' },
          { icon: 'swap', title: 'Switch to APN Real Estate', copy: 'How switching property managers works, even with tenants in place.', href: '/leasing/#switch' },
          { icon: 'tag', title: 'Thinking of selling?', copy: 'Sales and property management work together, including for tenanted sales.', href: '/appraisal/sales/' },
        ],
        team: 'property-management',
        teamTitle: 'Your property managers.',
        faqTitle: 'Questions from landlords.',
        faqMore: (
          <>
            More detail: <a href="/blog/what-does-a-property-manager-do/">a guide to what your property manager does</a>,
            or <a href="/leasing/">how property management with APN Real Estate works</a>.
          </>
        ),
        faqs: [
          {
            q: 'Who do I contact about my property?',
            a: 'Your property manager. Call the office on 1300 123 276 and ask for them by name, or send a message below and it will reach the property management team.',
          },
          {
            q: 'What does APN Real Estate’s property management include?',
            a: 'Finding and screening tenants, collecting rent, routine and entry/exit inspections, coordinating maintenance and repairs, and keeping you informed about your property.',
          },
          {
            q: 'What happens when something needs repairing?',
            a: 'Your property manager coordinates qualified tradespeople to get it sorted and keeps you informed about what’s happening and why.',
          },
          {
            q: 'Can I move my property to APN Real Estate if it’s tenanted?',
            a: 'Yes. Changing property managers is a normal process and doesn’t need to disrupt the tenancy. Tell us about your property and we’ll explain how it would work.',
          },
        ],
        form: {
          kind: 'general',
          topic: 'Property management',
          eyebrow: 'Message the team',
          title: 'Send your property manager a message.',
          copy: 'Tell us the property address and what it’s about, and the right person will get back to you.',
          submit: 'Send Message',
        },
      }}
    />
  );
}

export function TenantHub() {
  return (
    <HubPage
      config={{
        eyebrow: 'Tenants',
        path: '/client-hub/tenants/',
        title: 'Tenant hub.',
        lede: 'Renting with APN Real Estate, or looking for a place? Report a repair, find a rental, or get in touch with your property manager.',
        photo: STOCK.keysHand.photo,
        photoAlt: STOCK.keysHand.alt,
        actions: [
          { icon: 'wrench', title: 'Report a repair', copy: 'Urgent problems by phone, everything else to your property manager.', href: '#repairs' },
          { icon: 'home', title: 'Find a rental', copy: 'Current rentals, with photos and inspection times.', href: LISTINGS_LINKS.rent.href, external: true },
          { icon: 'bell', title: 'Get rental alerts', copy: 'Tell us what you’re after and we’ll be in touch when it comes up.', href: '/rent/#register' },
          { icon: 'users', title: 'Contact your property manager', copy: 'Questions about your lease, rent or moving out.', ...CALL, call: 'hub_tenant' },
        ],
        team: 'property-management',
        teamTitle: 'The property management team.',
        extra: <Repairs />,
        faqTitle: 'Questions from tenants.',
        faqs: [
          {
            q: 'How do I apply for a property?',
            a: 'Through the property’s listing on realestate.com.au. Book or attend an inspection, then apply from the listing.',
          },
          {
            q: 'Who do I talk to about my lease, rent or moving out?',
            a: 'Your property manager. Call the office on 1300 123 276 and ask for them, and they’ll explain what applies to your tenancy.',
          },
          {
            q: 'What counts as an urgent repair?',
            a: 'Anything unsafe or likely to cause serious damage if it waits, such as a burst pipe, a gas leak, no power or a security problem. Call us straight away, and call 000 first if anyone is in danger.',
          },
        ],
        form: MAINTENANCE_FORM_ENABLED
          ? {
              kind: 'maintenance',
              eyebrow: 'Non-urgent repairs',
              title: 'Report a repair.',
              copy: 'Tell us what’s wrong and where. Your property manager will be in touch to arrange it.',
              submit: 'Send Repair Request',
            }
          : {
              kind: 'general',
              topic: 'Renting',
              eyebrow: 'Get in touch',
              title: 'Send us a message.',
              copy: 'For anything that isn’t an urgent repair: include your address and what it’s about, and your property manager will get back to you.',
              submit: 'Send Message',
            },
      }}
    />
  );
}

export function SellerHub() {
  return (
    <HubPage
      config={{
        eyebrow: 'Sellers',
        path: '/client-hub/sellers/',
        title: 'Seller hub.',
        lede: 'Thinking of selling, or already selling with APN Real Estate? Get an appraisal, see recent results, or talk to the sales team.',
        photo: soldSign,
        photoAlt: 'An Adelaide Property Network SOLD sign outside a brick home',
        focalPoint: '70% center',
        actions: [
          { icon: 'chart', title: 'Get a sales appraisal', copy: 'A realistic price guide based on recent sales nearby. No obligation.', href: '/appraisal/sales/' },
          { icon: 'tag', title: 'See recent sales', copy: 'What APN Real Estate has sold recently.', href: '/sold/' },
          { icon: 'users', title: 'Talk to the sales team', copy: `Call ${PHONE_DISPLAY} about your sale.`, ...CALL, call: 'hub_seller' },
          { icon: 'key', title: 'Selling a tenanted property', copy: 'Our sales and property management teams work together on it.', href: '/selling/#appraisal' },
        ],
        team: 'sales',
        teamTitle: 'The sales team.',
        faqTitle: 'Questions from sellers.',
        faqMore: (
          <>
            See <a href="/selling/">how a sale works with APN Real Estate</a>, or{' '}
            <a href="/our-people/?filter=sales">meet the sales team</a>.
          </>
        ),
        faqs: [
          {
            q: 'How much is my property worth?',
            a: 'It depends on the property, recent sales nearby and the market at the time. Book a free appraisal and we’ll give you a realistic price guide based on comparable sales.',
          },
          {
            q: 'What does it cost to sell?',
            a: 'Commission and marketing costs depend on the property and the campaign. We set them out in writing, and you agree to them before anything goes ahead.',
          },
          {
            q: 'How will I know how my sale is going?',
            a: 'Your agent will talk you through the plan before the campaign starts and give you feedback after inspections. If you want an update, call the office and ask for them.',
          },
          {
            q: 'Can I sell while the property is tenanted?',
            a: 'Yes. Because APN Real Estate does property management as well as sales, we can explain how a sale works with tenants in place, including inspections and notice.',
          },
        ],
        form: {
          kind: 'sales-appraisal',
          eyebrow: 'Free sales appraisal',
          title: 'What could your property sell for?',
          copy: 'Tell us about your property and a member of our sales team will be in touch to arrange an appraisal.',
          submit: 'Book My Sales Appraisal',
        },
      }}
    />
  );
}

export function BuyerHub() {
  return (
    <HubPage
      config={{
        eyebrow: 'Buyers',
        path: '/client-hub/buyers/',
        title: 'Buyer hub.',
        lede: 'Looking for your next home or investment? See what’s for sale, join our buyer list, or talk to the sales team.',
        photo: mountGambierStreet,
        photoAlt: 'Homes on a hillside street in Mount Gambier',
        focalPoint: '30% 65%',
        actions: [
          { icon: 'home', title: 'Properties for sale', copy: 'Current listings, with photos, inspection times and price guides.', href: LISTINGS_LINKS.buy.href, external: true },
          { icon: 'bell', title: 'Join our buyer list', copy: 'Hear about suitable new listings from the sales team.', href: '/buy/#register' },
          { icon: 'tag', title: 'See what’s sold', copy: 'A feel for what similar homes have sold for.', href: '/sold/' },
          { icon: 'chart', title: 'Selling before you buy?', copy: 'Find out what your current property is worth.', href: '/appraisal/sales/' },
        ],
        team: 'sales',
        teamTitle: 'The sales team.',
        faqTitle: 'Questions from buyers.',
        faqs: [
          {
            q: 'How do I find out about inspections?',
            a: 'Inspection times are on each property’s listing on realestate.com.au. If a time doesn’t suit, call the office and ask about a private inspection.',
          },
          {
            q: 'How do I make an offer?',
            a: 'Talk to the listing agent. They’ll explain how offers work for that property, including if it’s going to auction.',
          },
          {
            q: 'Can you tell me when something suitable comes up?',
            a: 'Join our buyer list with what you’re looking for, and the sales team will let you know when something suitable comes up.',
          },
        ],
        form: {
          kind: 'buyer-register',
          eyebrow: 'Buyer list',
          title: 'Tell us what you’re looking for.',
          copy: 'The sales team will let you know when something suitable comes up.',
          submit: 'Join the Buyer List',
        },
      }}
    />
  );
}

/* ---------- Overview (/client-hub/) ---------- */

export function HubOverview() {
  return (
    <Layout>
      <PageHero
        eyebrow="Client hub"
        title="How can we help?"
        lede="Choose what you’re here for, and find the people, forms and answers for it in one place."
        photo={STOCK.suburbAerial.photo}
        photoAlt={STOCK.suburbAerial.alt}
      />
      <section className="section section-white">
        <div className="wrap">
          <ImageCards
            items={[
              { href: '/client-hub/landlords/', image: STOCK.openPlan.photo, alt: '', kicker: 'I own a rental', title: 'Landlord hub' },
              { href: '/client-hub/tenants/', image: STOCK.keysHand.photo, alt: '', kicker: 'I’m renting', title: 'Tenant hub' },
              { href: '/client-hub/sellers/', image: soldSign, alt: '', kicker: 'I’m selling', title: 'Seller hub' },
              { href: '/client-hub/buyers/', image: mountGambierStreet, alt: '', kicker: 'I’m buying', title: 'Buyer hub' },
            ]}
          />
        </div>
      </section>
      <Repairs />
      <CtaBand
        title="Not sure where to start?"
        copy="Call the office and we’ll put you through to the right person."
        href="/contact/"
        label="Contact Us"
      />
    </Layout>
  );
}
