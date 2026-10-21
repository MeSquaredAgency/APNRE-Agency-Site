import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import JsonLd from '../components/JsonLd';
import { Faq, FormSection, ProseSection, Team, type FaqItem } from '../components/sections';
import { TEAM } from '../data/team';
import type { OfficeId } from '../data/offices';
import {
  clearAppraisalAddress,
  readAppraisalAddress,
  type AppraisalType,
} from '../lib/appraisal-handoff';
import { breadcrumbList, OFFICE_SCHEMA_IDS, ORGANIZATION_ID, SITE } from '../structured-data';

// Four pages share this: /appraisal/sales/ and /appraisal/rental/, each
// the landing page for its own search ("free sales appraisal", "rental
// appraisal"), /mount-gambier/rental-appraisal/ for "rental appraisal
// Mount Gambier", and /appraisal/, the general one with a sales/rental
// switch that the header's "Book a Free Appraisal" button and older
// ?type= links use. The single-type pages add what the appraisal covers,
// who does it and a short FAQ under the form; /appraisal/ stays the
// chooser.
//
// Only claims APN already makes elsewhere: free, no obligation, based on
// the property and recent sales or rentals nearby. No turnaround times
// until APN confirms them.

const COPY: Record<
  AppraisalType,
  { title: string; copy: string; steps: string[]; submit: string; service: { href: string; label: string } }
> = {
  sales: {
    title: 'Free sales appraisal in Adelaide & Mount Gambier.',
    copy: 'What could your property sell for? Tell us about it and a member of our sales team will be in touch to arrange an appraisal.',
    steps: ['We look at your property and recent sales nearby', 'We give you a realistic price guide', 'You decide, with no obligation'],
    submit: 'Book My Sales Appraisal',
    service: { href: '/selling/', label: 'How we sell' },
  },
  rental: {
    title: 'Free rental appraisal in Adelaide & Mount Gambier.',
    copy: 'What could your property rent for? Tell us about it and a local APN Real Estate property manager will review the details and contact you directly.',
    steps: ['We review your property', 'An APN Real Estate property manager contacts you', 'You decide, with no obligation to appoint APN Real Estate'],
    submit: 'Get My Free Rental Appraisal',
    service: { href: '/leasing/', label: 'How we manage rentals' },
  },
};

/** What each appraisal looks at, for the "What it covers" section. */
const COVERS: Record<AppraisalType, { lede: string; points: string[] }> = {
  sales: {
    lede: 'A sales appraisal is our view of what your property would sell for in today’s market, and why.',
    points: [
      'Your property itself: its land, layout, condition and the things buyers will notice.',
      'Recent sales of comparable properties nearby, and what’s on the market now that buyers will compare it with.',
      'A realistic price guide, and how we’d approach selling it.',
    ],
  },
  rental: {
    lede: 'A rental appraisal is our view of what your property should lease for in today’s rental market, and why.',
    points: [
      'Your property itself: its size, features and condition, and what tenants in the area look for.',
      'Comparable rentals nearby: what’s leased recently and what tenants can choose from now.',
      'What we think it should lease for, and anything that would help it lease well.',
    ],
  },
};

const FAQS: Record<AppraisalType, FaqItem[]> = {
  sales: [
    {
      q: 'Does a sales appraisal cost anything?',
      a: 'No. It’s free, and there’s no obligation to sell or to list with APN Real Estate.',
    },
    {
      q: 'Is an appraisal the same as a valuation?',
      a: 'No. An appraisal is an agent’s opinion of the likely selling price, based on the property and recent sales nearby. A formal valuation is done by a certified valuer, usually for a bank or a legal matter.',
    },
    {
      q: 'What happens after I send the form?',
      a: 'A member of our sales team gets in touch to arrange a time to see the property, then talks you through the price guide and how a sale would work.',
    },
    {
      q: 'I’m not ready to sell yet. Can I still ask?',
      a: 'Yes. Plenty of people ask for an appraisal to plan ahead. You decide what to do next, if anything.',
    },
  ],
  rental: [
    {
      q: 'Does a rental appraisal cost anything?',
      a: 'No. It’s free, and there’s no obligation to appoint APN Real Estate to manage the property.',
    },
    {
      q: 'My property is managed by another agent. Can I still get one?',
      a: 'Yes. Many landlords ask for an appraisal when they’re thinking about changing property managers.',
    },
    {
      q: 'What happens after I send the form?',
      a: 'A local APN Real Estate property manager reviews the details and contacts you directly to talk through the rent and anything else you’d like to know.',
    },
    {
      q: 'Can you appraise a property that isn’t rented yet?',
      a: 'Yes, whether it’s a new investment, your own home you’re moving out of, or a property you manage yourself.',
    },
  ],
};

/** Who does each kind of appraisal, by office: the sales group for sales,
 *  the property managers for rentals (src/data/team.ts). */
function appraisers(type: AppraisalType, office?: OfficeId): string[] {
  const group = type === 'sales' ? 'sales' : 'property-management';
  return TEAM.filter((m) => m.groups.includes(group) && (!office || m.office === office)).map((m) => m.name);
}

const OTHER: Record<AppraisalType, { href: string; label: string }> = {
  sales: { href: '/appraisal/rental/', label: 'Leasing it out instead? Get a rental appraisal.' },
  rental: { href: '/appraisal/sales/', label: 'Thinking of selling instead? Get a sales appraisal.' },
};

interface PageOptions {
  path: string;
  /** Breadcrumb and service name. */
  name: string;
  /** A one-office version, e.g. Mount Gambier's rental appraisal page. */
  office?: OfficeId;
  /** Replaces the heading, intro or service link above the form. */
  overrides?: Partial<Pick<(typeof COPY)[AppraisalType], 'title' | 'copy' | 'service'>>;
}

const PAGES: Record<AppraisalType, PageOptions> = {
  sales: { path: '/appraisal/sales/', name: 'Sales appraisal' },
  rental: { path: '/appraisal/rental/', name: 'Rental appraisal' },
};

/** What the appraisal covers, who does it and a short FAQ, under the
 *  form on the single-type pages. */
function AppraisalDetails({ type, page }: { type: AppraisalType; page: PageOptions }) {
  const covers = COVERS[type];
  const names = appraisers(type, page.office);
  return (
    <>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          ...(page.office === 'mount-gambier' ? [{ name: 'Mount Gambier', path: '/mount-gambier/' }] : [{ name: 'Appraisal', path: '/appraisal/' }]),
          { name: page.name, path: page.path },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: page.name,
          serviceType: type === 'sales' ? 'Property sales appraisal' : 'Rental appraisal',
          url: `${SITE}${page.path}`,
          description: covers.lede,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
          provider: { '@id': page.office ? OFFICE_SCHEMA_IDS[page.office] : ORGANIZATION_ID },
          areaServed: page.office
            ? { '@type': 'City', name: 'Mount Gambier' }
            : [
                { '@type': 'City', name: 'Adelaide' },
                { '@type': 'City', name: 'Mount Gambier' },
              ],
        }}
      />
      <ProseSection eyebrow="What it covers" title={type === 'sales' ? 'What a sales appraisal looks at.' : 'What a rental appraisal looks at.'}>
        <p className="lede">{covers.lede}</p>
        <ul>
          {covers.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p>
          {type === 'sales' ? (
            <>
              More about <a href="/selling/">how we sell</a>, or see our <a href="/sold/">recent sales</a>.
            </>
          ) : page.office === 'mount-gambier' ? (
            <>
              More about <a href="/mount-gambier/property-management/">property management in Mount Gambier</a>, or{' '}
              <a href="/leasing/switching-property-managers/">how switching property managers works</a>.
            </>
          ) : (
            <>
              More about <a href="/leasing/">how we manage rentals</a>, or{' '}
              <a href="/leasing/switching-property-managers/">how switching property managers works</a>.
            </>
          )}
        </p>
      </ProseSection>
      <Team
        names={names}
        credentials
        eyebrow="Who does it"
        title={
          page.office === 'mount-gambier'
            ? 'Your Mount Gambier property managers.'
            : type === 'sales'
              ? 'Your appraisal, from our sales team.'
              : 'Your appraisal, from a local property manager.'
        }
      />
      <Faq title="Questions about appraisals." items={FAQS[type]} />
    </>
  );
}

/** `fixed` makes it a single-type page with no switch; `page` overrides
 *  its path, heading and copy (Mount Gambier's rental appraisal). */
function Appraisal({ fixed, page }: { fixed?: AppraisalType; page?: PageOptions }) {
  // Pre-rendered with no address (and, on /appraisal/, as sales). After
  // hydration, ?type= and the address typed into the home hero (if any)
  // are read here, never during render, so the server's HTML and the
  // browser's first render match. The address is cleared once read, so a
  // later visit starts empty.
  const [type, setType] = useState<AppraisalType>(fixed ?? 'sales');
  const [address, setAddress] = useState('');
  useEffect(() => {
    if (!fixed && new URLSearchParams(window.location.search).get('type') === 'rental') setType('rental');
    setAddress(readAppraisalAddress());
    clearAppraisalAddress();
  }, [fixed]);
  const copy = { ...COPY[type], ...page?.overrides };

  function choose(next: AppraisalType) {
    setType(next);
    const url = new URL(window.location.href);
    url.searchParams.set('type', next);
    window.history.replaceState(null, '', url);
  }

  return (
    <Layout>
      <div className="appraisal-page">
        <FormSection
          titleAs="h1"
          eyebrow={fixed ? 'Free appraisal' : 'Adelaide & Mount Gambier'}
          // The general page keeps one heading for both types, so search
          // engines (which see the pre-rendered sales version) read a
          // heading that covers both.
          title={fixed ? copy.title : 'Free sales or rental appraisal.'}
          copy={
            <>
              {copy.copy} <a href={copy.service.href}>{copy.service.label}</a>.
              {fixed && (
                <>
                  {' '}
                  <a href={OTHER[type].href}>{OTHER[type].label}</a>
                </>
              )}
            </>
          }
          steps={copy.steps}
        >
          <EnquiryForm
            // Remount once the hero's address arrives (the address field
            // is uncontrolled, so it only reads defaultAddress on mount).
            // Not on a sales/rental switch: that keeps what's been typed
            // and keeps focus on the switch.
            key={address}
            kind={type === 'sales' ? 'sales-appraisal' : 'rental-appraisal'}
            submitLabel={copy.submit}
            defaultAddress={address}
            before={
              fixed ? undefined : (
                <div className="segmented" role="group" aria-label="Appraisal type">
                  <button type="button" aria-pressed={type === 'sales'} onClick={() => choose('sales')}>
                    I’m thinking of selling
                  </button>
                  <button type="button" aria-pressed={type === 'rental'} onClick={() => choose('rental')}>
                    I want to lease it out
                  </button>
                </div>
              )
            }
          />
        </FormSection>
      </div>
      {fixed ? (
        <AppraisalDetails type={fixed} page={page ?? PAGES[fixed]} />
      ) : (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Free property appraisal',
            serviceType: 'Property sales and rental appraisal',
            url: `${SITE}/appraisal/`,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
            provider: { '@id': ORGANIZATION_ID },
          }}
        />
      )}
    </Layout>
  );
}

export default function GeneralAppraisal() {
  return <Appraisal />;
}

export function SalesAppraisal() {
  return <Appraisal fixed="sales" />;
}

export function RentalAppraisal() {
  return <Appraisal fixed="rental" />;
}

export function MountGambierRentalAppraisal() {
  return (
    <Appraisal
      fixed="rental"
      page={{
        path: '/mount-gambier/rental-appraisal/',
        name: 'Rental appraisal, Mount Gambier',
        office: 'mount-gambier',
        overrides: {
          title: 'Free rental appraisal in Mount Gambier.',
          copy: 'What could your Mount Gambier property rent for? Tell us about it and Luke or Jenny, from our office on Commercial Street East, will review the details and contact you directly.',
          service: { href: '/mount-gambier/property-management/', label: 'Property management in Mount Gambier' },
        },
      }}
    />
  );
}
