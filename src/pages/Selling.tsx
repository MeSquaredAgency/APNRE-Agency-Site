import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import { CtaBand, Faq, FormSection, PageHero, Process, Reasons, Team } from '../components/sections';
import { service } from '../structured-data';
import soldSign from '../assets/photos/sold-sign-fenden-rd.jpg?photo';

// Keep every claim here to something APN can stand behind: no sales
// figures, days-on-market or rankings unless they're verified and dated.

const REASONS = [
  {
    title: 'Sales led by the founder',
    copy: 'Patrick Nhim started the business and still leads the sales team, so the person who built the business is part of how your sale is run.',
  },
  {
    title: 'Sales and property management together',
    copy: 'Selling a tenanted investment, or buying your next one? Our sales and property management teams work side by side, so the handover is one conversation.',
  },
  {
    title: 'Local in two markets',
    copy: 'With offices in Blair Athol and Mount Gambier, you’re dealing with people who work in your local market every day.',
  },
];

const STEPS = [
  {
    title: 'Appraisal',
    copy: 'We look at your property, talk through recent comparable sales and give you a realistic price guide. No obligation.',
  },
  {
    title: 'Plan',
    copy: 'We agree the method of sale, the marketing and the costs with you, in writing, before anything starts.',
  },
  {
    title: 'Market',
    copy: 'Photography, online listings and signboards, then open inspections and private viewings, with feedback after each one.',
  },
  {
    title: 'Negotiate & settle',
    copy: 'We present every offer, negotiate on your behalf and stay with you through to settlement.',
  },
];

const FAQS = [
  {
    q: 'How much is my property worth?',
    a: 'It depends on the property, recent sales nearby and the market at the time. Book a free appraisal and we’ll give you a realistic price guide based on comparable sales.',
  },
  {
    q: 'What does it cost to sell?',
    a: 'Commission and marketing costs depend on the property and the campaign. We set them out in writing, and you agree to them before anything goes ahead.',
  },
  {
    q: 'Should I sell by auction or private sale?',
    a: 'Each suits different properties and situations. We’ll talk through the options for your property at the appraisal and recommend the one we think fits.',
  },
  {
    q: 'Can I sell while the property is tenanted?',
    a: 'Yes. Because APN does property management as well as sales, we can explain how a sale works with tenants in place, including inspections and notice.',
  },
  {
    q: 'How long does it take to sell?',
    a: 'That depends on the property, the price and the market. We’ll give you a realistic idea at the appraisal.',
  },
];

export default function Selling() {
  return (
    <Layout>
      <JsonLd
        data={service({
          name: 'Residential Property Sales',
          serviceType: 'Residential real estate sales',
          path: '/selling/',
          description: STEPS.map((s) => s.copy).join(' '),
        })}
      />
      <PageHero
        eyebrow="Selling with APN"
        title="Sell your home in Adelaide or Mount Gambier."
        lede="A clear plan, honest pricing advice and regular updates, from appraisal right through to settlement."
        photo={soldSign}
        photoAlt="An Adelaide Property Network SOLD sign outside a home in Salisbury"
        focalPoint="30% center"
      >
        <div className="page-hero__actions">
          <a href="#appraisal" className="btn btn-primary">
            Book a Sales Appraisal <Icon name="arrow" />
          </a>
          <a href="/sold/" className="btn btn-outline-light">
            See Recent Sales
          </a>
        </div>
      </PageHero>
      <Reasons eyebrow="Why sellers choose APN" title="The people behind your sale." items={REASONS} />
      <Process eyebrow="Our selling process" title="How a sale works with us." steps={STEPS} />
      <Team group="sales" eyebrow="Sales team" title="Who you’ll work with." />
      <Faq
        title="Questions sellers ask us."
        items={FAQS}
        more={
          <>
            Already selling with APN? Go to the <a href="/client-hub/sellers/">seller hub</a>, or{' '}
            <a href="/our-people/?filter=sales">meet the sales team</a>.
          </>
        }
      />
      <FormSection
        id="appraisal"
        eyebrow="Free sales appraisal"
        title="What could your property sell for?"
        copy="Tell us about your property and a member of our sales team will be in touch to arrange an appraisal."
        steps={['We look at your property and recent sales nearby', 'We give you a realistic price guide', 'You decide, with no obligation']}
      >
        <EnquiryForm kind="sales-appraisal" submitLabel="Book My Sales Appraisal" />
      </FormSection>
      <CtaBand
        title="Thinking of selling?"
        copy="Start with a conversation. We’ll tell you what we think your property is worth and why."
        href="#appraisal"
        label="Book a Sales Appraisal"
      />
    </Layout>
  );
}
