import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import { FormSection } from '../components/sections';
import {
  clearAppraisalAddress,
  readAppraisalAddress,
  type AppraisalType,
} from '../lib/appraisal-handoff';

// Three pages share this: /appraisal/sales/ and /appraisal/rental/, each
// aimed at its own search ("free sales appraisal", "rental appraisal"),
// and /appraisal/, the general one with a sales/rental switch that the
// header's "Book a Free Appraisal" button and older ?type= links use.

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
    copy: 'What could your property rent for? Tell us about it and a local APN property manager will review the details and contact you directly.',
    steps: ['We review your property', 'An APN property manager contacts you', 'You decide, with no obligation to appoint APN'],
    submit: 'Get My Free Rental Appraisal',
    service: { href: '/leasing/', label: 'How we manage rentals' },
  },
};

const OTHER: Record<AppraisalType, { href: string; label: string }> = {
  sales: { href: '/appraisal/rental/', label: 'Leasing it out instead? Get a rental appraisal.' },
  rental: { href: '/appraisal/sales/', label: 'Thinking of selling instead? Get a sales appraisal.' },
};

/** `fixed` makes it a single-type page with no switch. */
function Appraisal({ fixed }: { fixed?: AppraisalType }) {
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
  const copy = COPY[type];

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
