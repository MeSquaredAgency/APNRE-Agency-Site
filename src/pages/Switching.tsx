// /leasing/switching-property-managers/: a step-by-step guide for
// landlords thinking of changing property managers, with the rental
// appraisal form pre-ticked "Changing property managers".
//
// Same rule as the client hubs: APN explains its own process and points
// to the official sources for the rules (notice periods, bonds, tenants'
// rights); it doesn't interpret them. The signed-off lines from /leasing/
// ("a straightforward process", "doesn't need to disrupt an existing
// tenancy") are the only claims about how it goes. Have APN check any
// change to the steps.

import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import Laws, { LAWS } from '../components/Laws';
import { CtaBand, Faq, FormSection, PageHero, Process, ProseSection, Team } from '../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import { breadcrumbList } from '../structured-data';
import interiorPhoto from '../assets/photos/interior-corner-windows.jpg?photo';

const PATH = '/leasing/switching-property-managers/';

const STEPS = [
  {
    title: 'Check your current agreement',
    copy: 'Your management agreement with your current agency says how to end it: the notice it needs, in writing, and anything else that applies. Have it handy when you talk to us.',
  },
  {
    title: 'Talk to us',
    copy: 'Tell us about the property and what isn’t working. We’ll give you a rental appraisal and introduce the property manager who would look after it.',
  },
  {
    title: 'Give notice',
    copy: 'Once you’ve decided, you give your current agency notice in the way your agreement sets out, and sign a management agreement with us.',
  },
  {
    title: 'Handover',
    copy: 'We arrange the handover with your current agency, including the keys and the records for the property and its tenancy, and let your tenants know who their property manager is from then on.',
  },
];

const FAQS = [
  {
    q: 'Can I change property managers if my property is tenanted?',
    a: 'Yes. It’s a normal process and doesn’t need to disrupt an existing tenancy. Tell us your situation and we’ll explain how it would work for your property.',
  },
  {
    q: 'How long does it take?',
    a: 'Mostly it depends on the notice period in your current management agreement. Send us the agreement, or tell us what it says, and we’ll tell you when we could take over.',
  },
  {
    q: 'Do I have to tell my current property manager why I’m leaving?',
    a: 'No. You only need to give notice the way your agreement asks for it.',
  },
  {
    q: 'What happens to my tenants and their bond?',
    a: 'Your tenants are told who their new property manager is and how to reach them. For the rules on tenancies and bonds in South Australia, see the official guides from Consumer and Business Services linked on this page.',
  },
  {
    q: 'Can I get a rental appraisal before I decide?',
    a: 'Yes. A rental appraisal is free and there’s no obligation to appoint APN Real Estate.',
  },
];

export default function Switching() {
  return (
    <Layout>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Property management', path: '/leasing/' },
          { name: 'Switching property managers', path: PATH },
        ])}
      />
      <PageHero
        eyebrow="Changing property managers"
        title="How to switch property managers in South Australia."
        lede="Changing property managers is a straightforward process, and it doesn’t need to disrupt an existing tenancy. Here’s what’s involved."
        photo={interiorPhoto}
        photoAlt="Floor-to-ceiling corner windows in a property managed by APN Real Estate"
      >
        <div className="page-hero__actions">
          <a href="#switch" className="btn btn-primary">
            Talk to Us About Switching <Icon name="arrow" />
          </a>
          <a href={PHONE_TEL} className="btn btn-outline-light" onClick={() => trackCallClick('switching_hero')}>
            <Icon name="phone" /> {PHONE_DISPLAY}
          </a>
        </div>
      </PageHero>

      <Process eyebrow="Step by step" title="Switching to APN Real Estate." steps={STEPS} />

      <ProseSection eyebrow="Before you start" title="What to have ready." paper>
        <p className="lede">A few things make the conversation quicker.</p>
        <ul>
          <li>Your current management agreement, so we can see how it ends.</li>
          <li>The property’s address and when the current lease ends, if you know.</li>
          <li>What you’d like done differently, so we can tell you honestly whether we can do it.</li>
        </ul>
        <p>
          Not sure yet? Read <a href="/blog/what-does-a-property-manager-do/">what a property manager should do</a>,
          or see <a href="/leasing/">how we manage properties</a> in Adelaide and{' '}
          <a href="/mount-gambier/property-management/">Mount Gambier</a>.
        </p>
      </ProseSection>

      <Team group="property-management" credentials eyebrow="Who you’d work with" title="Our property managers." />

      <Faq title="Questions about switching." items={FAQS} />

      <Laws items={[LAWS.rentingAdvice, LAWS.bonds, LAWS.rentalReforms, LAWS.residentialTenancies]} />

      <FormSection
        id="switch"
        eyebrow="Thinking of switching?"
        title="Tell us about your property."
        copy="A local APN Real Estate property manager will review the details and contact you directly to talk it through."
        steps={['We review your property', 'An APN Real Estate property manager contacts you', 'You decide, with no obligation to appoint APN Real Estate']}
      >
        <EnquiryForm kind="rental-appraisal" submitLabel="Talk to Us About Switching" defaultHelp={['switching']} />
      </FormSection>
      <CtaBand
        title="Ready for a property manager you can reach?"
        copy="Get a free rental appraisal, or call us to talk about switching."
        href="#switch"
        label="Talk to Us About Switching"
      />
    </Layout>
  );
}
