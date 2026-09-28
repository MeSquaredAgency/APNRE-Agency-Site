import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import { FormSection } from '../components/sections';
import {
  clearAppraisalAddress,
  readAppraisalAddress,
  type AppraisalType,
} from '../lib/appraisal-handoff';

const COPY: Record<AppraisalType, { title: string; copy: string; steps: string[]; submit: string }> = {
  sales: {
    title: 'What could your property sell for?',
    copy: 'Tell us about your property and a member of our sales team will be in touch to arrange an appraisal.',
    steps: ['We look at your property and recent sales nearby', 'We give you a realistic price guide', 'You decide, with no obligation'],
    submit: 'Book My Sales Appraisal',
  },
  rental: {
    title: 'What is your property really worth to rent?',
    copy: 'Tell us about your property. A local APN property manager will review the details and contact you directly.',
    steps: ['We review your property', 'An APN property manager contacts you', 'You decide, with no obligation to appoint APN'],
    submit: 'Get My Free Rental Appraisal',
  },
};

export default function Appraisal() {
  const [type, setType] = useState<AppraisalType>(() =>
    new URLSearchParams(window.location.search).get('type') === 'rental' ? 'rental' : 'sales',
  );
  // The address typed into the home hero, if any. Cleared once read, so
  // a later visit to this page starts empty.
  const [address] = useState(readAppraisalAddress);
  useEffect(clearAppraisalAddress, []);
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
        <FormSection titleAs="h1" eyebrow="Free appraisal" title={copy.title} copy={copy.copy} steps={copy.steps}>
          <EnquiryForm
            // Remount on switch so the fields for the other type reset,
            // but keep what they typed as the address.
            key={type}
            kind={type === 'sales' ? 'sales-appraisal' : 'rental-appraisal'}
            submitLabel={copy.submit}
            defaultAddress={address}
            before={
              <div className="segmented" role="group" aria-label="Appraisal type">
                <button type="button" aria-pressed={type === 'sales'} onClick={() => choose('sales')}>
                  I’m thinking of selling
                </button>
                <button type="button" aria-pressed={type === 'rental'} onClick={() => choose('rental')}>
                  I want to lease it out
                </button>
              </div>
            }
          />
        </FormSection>
      </div>
    </Layout>
  );
}
