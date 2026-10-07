import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import Picture from '../components/Picture';
import { CtaBand, Faq, FormSection, PageHero, Process, Reasons, Team } from '../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import { service } from '../structured-data';
import heroPhoto from '../assets/photos/balcony-view-hills.jpg?photo';
import balconyWide from '../assets/photos/balcony-view-wide.jpg?photo';

// Reasons, switching copy and FAQs come from the landlord landing page
// (APNRE-Website), where APN has already signed them off. Keep the two
// in step if either changes.

const REASONS = [
  {
    title: 'People on the ground',
    copy: 'APN Real Estate operates across Adelaide and Mount Gambier, with people on the ground in both markets.',
  },
  {
    title: 'Know who’s looking after it',
    copy: 'You’ll know who is responsible for your property and how to reach them directly.',
  },
  {
    title: 'You make the decisions',
    copy: 'Our job is to manage the property professionally, keep you informed and give you the information you need to make your own decisions.',
  },
];

const STEPS = [
  {
    title: 'Rental appraisal',
    copy: 'We look at the property and the local rental market and tell you what we think it should lease for.',
  },
  {
    title: 'Prepare & advertise',
    copy: 'We help get the property ready, then list it and run inspections for prospective tenants.',
  },
  {
    title: 'Find the right tenant',
    copy: 'We screen applicants and recommend a tenant. You make the final decision.',
  },
  {
    title: 'Ongoing management',
    copy: 'Rent collection, routine inspections, maintenance coordination and regular updates from your property manager.',
  },
];

const FAQS = [
  {
    q: 'What does APN Real Estate’s property management service include?',
    a: 'Finding and screening tenants, collecting rent, routine and entry/exit inspections, coordinating maintenance and repairs, and keeping you informed about your property. Get in touch and your property manager can walk you through what that looks like for your specific property.',
  },
  {
    q: 'What happens when something needs repairing?',
    a: 'Your property manager coordinates qualified tradespeople to get it sorted and keeps you informed about what’s happening and why. If you’d like the specifics of how repairs are handled for your property, ask your property manager directly.',
  },
  {
    q: 'How much does property management cost?',
    a: 'Management fees vary depending on your property and what you need. Get in touch and we’ll give you a straight answer for your specific property.',
  },
  {
    q: 'Can I change property managers if my property is currently tenanted?',
    a: 'Yes — it’s a normal process and doesn’t need to disrupt an existing tenancy. Tell us your situation and we’ll explain how it would work for your property.',
  },
  {
    q: 'Who will manage my property, and can I speak to them directly?',
    a: 'A named property manager from our team. You’ll know who they are and be able to reach them directly.',
  },
  {
    q: 'How quickly can my property be leased?',
    a: 'This depends on the property, the market, and the time of year. Ask us for a rental appraisal and we’ll give you a realistic view for your property.',
  },
];

function Switching() {
  return (
    <section className="photo-band" id="switch">
      <Picture photo={balconyWide} alt="" className="photo-band__img" />
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
      <Faq
        title="Questions landlords ask us."
        items={FAQS}
        more={
          <>
            More detail: <a href="/blog/what-does-a-property-manager-do/">what does a property manager do?</a> Already
            with APN Real Estate? Go to the <a href="/client-hub/landlords/">landlord hub</a>, or{' '}
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
