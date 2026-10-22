import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import GoogleReviews from '../components/GoogleReviews';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import Picture from '../components/Picture';
import { CtaBand, Faq, FormSection, PageHero, Process, Reasons, Team } from '../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import { LEASING_FAQS as FAQS, LEASING_REASONS as REASONS, LEASING_STEPS as STEPS } from '../data/leasing';
import { service } from '../structured-data';
import heroPhoto from '../assets/photos/balcony-view-hills.jpg?photo';
import interiorPhoto from '../assets/photos/interior-corner-windows.jpg?photo';

// Reasons, switching copy and FAQs come from the landlord landing page
// (APNRE-Website), where APN has already signed them off; the reasons,
// steps and FAQs live in src/data/leasing.ts, shared with the Mount
// Gambier property management page.

function Switching() {
  return (
    <section className="photo-band" id="switch">
      {/* A property APN manages; not the balcony view again, which the
          hero already uses. */}
      <Picture photo={interiorPhoto} alt="" className="photo-band__img" />
      <div className="photo-band__scrim" />
      <div className="wrap photo-band__inner">
        <span className="eyebrow">Already have a property manager?</span>
        <h2 className="h-display">Thinking about a change?</h2>
        <p className="lede">
          Changing property managers is a straightforward process. Tell us
          about your property and we’ll explain what’s involved, including
          how the transition works while your property is tenanted.
        </p>
        <div className="page-hero__actions">
          <a href="#appraisal" className="btn btn-primary">
            Talk to Us About Switching <Icon name="arrow" />
          </a>
          <a href={PHONE_TEL} className="btn btn-outline-light" onClick={() => trackCallClick('leasing_switch')}>
            Or call {PHONE_DISPLAY}
          </a>
        </div>
        <p className="photo-band__more">
          <a href="/leasing/switching-property-managers/">How switching property managers works in SA</a>
        </p>
      </div>
    </section>
  );
}

export default function Leasing() {
  return (
    <Layout>
      <JsonLd
        data={service({
          name: 'Leasing & Property Management',
          serviceType: 'Residential property management',
          path: '/leasing/',
          description: STEPS.map((s) => s.copy).join(' '),
        })}
      />
      <PageHero
        eyebrow="Leasing & property management"
        title="Property management in Adelaide & Mount Gambier."
        lede="Your property is an asset, and we treat it like one, with a named property manager you can reach directly."
        photo={heroPhoto}
        photoAlt="View across the Adelaide hills from one of the properties APN Real Estate manages"
        focalPoint="center 78%"
      >
        <div className="page-hero__actions">
          <a href="#appraisal" className="btn btn-primary">
            Get a Rental Appraisal <Icon name="arrow" />
          </a>
          <a href="/rent/" className="btn btn-outline-light">
            Looking to Rent?
          </a>
        </div>
      </PageHero>
      <Reasons
        eyebrow="Why landlords choose APN Real Estate"
        title="A property manager you can actually reach."
        items={REASONS}
        dark
      />
      <Process eyebrow="Our leasing process" title="From appraisal to a tenant in place." steps={STEPS} />
      <Switching />
      <Team group="property-management" credentials eyebrow="Property management" title="Your property managers." />
      <GoogleReviews id="reviews" />
      <Faq
        title="Questions landlords ask us."
        items={FAQS}
        more={
          <>
            More detail: <a href="/blog/what-does-a-property-manager-do/">what does a property manager do?</a> and{' '}
            <a href="/leasing/switching-property-managers/">how to switch property managers in SA</a>. In Mount Gambier?
            See <a href="/mount-gambier/property-management/">property management in Mount Gambier</a>. Already with APN
            Real Estate? Go to the <a href="/client-hub/landlords/">landlord hub</a>, or{' '}
            <a href="/our-people/?filter=property-management">meet our property managers</a>.
          </>
        }
      />
      <FormSection
        id="appraisal"
        eyebrow="Free rental appraisal"
        title="What could your property rent for?"
        copy="Tell us about your property. A local APN Real Estate property manager will review the details and contact you directly."
        steps={['We review your property', 'An APN Real Estate property manager contacts you', 'You decide, with no obligation to appoint APN Real Estate']}
      >
        <EnquiryForm kind="rental-appraisal" submitLabel="Get My Free Rental Appraisal" />
      </FormSection>
      <CtaBand
        title="Let’s talk about your property."
        copy="Get a free rental appraisal, or call us for a chat about your property."
        href="#appraisal"
        label="Get a Rental Appraisal"
      />
    </Layout>
  );
}
