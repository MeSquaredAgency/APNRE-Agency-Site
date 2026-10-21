// /mount-gambier/property-management/: property management from the
// Mount Gambier office, the page for "property management Mount Gambier"
// searches (the office page, /mount-gambier/, covers the office itself).
//
// Built from what's already confirmed: the office (offices.ts), Luke's and
// Jenny's bios and roles (team.ts), and the leasing copy APN signed off
// (src/data/leasing.ts). TODO(mount-gambier): Luke and Jenny to add the
// local detail search rewards, in their own words: the suburbs and towns
// they cover, how often routine inspections happen, what's leasing well
// and the local rent picture. Don't fill these in without them.

import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import GoogleReviews from '../components/GoogleReviews';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import { Actions, CtaBand, Faq, FormSection, PageHero, Process, ProseSection, Reasons, Team } from '../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { LEASING_FAQS, LEASING_REASONS, LEASING_STEPS } from '../data/leasing';
import { OFFICES } from '../data/offices';
import { suppliedPhoto } from '../data/supplied';
import { trackCallClick } from '../lib/analytics';
import { breadcrumbList, OFFICE_SCHEMA_IDS, SITE } from '../structured-data';
import mountGambierStreet from '../assets/photos/mount-gambier-hillside-street.jpg?photo';

const PATH = '/mount-gambier/property-management/';
const OFFICE = OFFICES['mount-gambier'];
/** The office itself once it's supplied; until then a Mount Gambier street. */
const PHOTO = suppliedPhoto('mount-gambier-office');

/** Mount Gambier's property managers, as on the office page. */
const MOUNT_GAMBIER_PMS = ['Luke Whittaker', 'Jenny Saffin'];

export default function MountGambierPropertyManagement() {
  return (
    <Layout>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Mount Gambier', path: '/mount-gambier/' },
          { name: 'Property management', path: PATH },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Property Management in Mount Gambier',
          serviceType: 'Residential property management',
          url: `${SITE}${PATH}`,
          description: LEASING_STEPS.map((s) => s.copy).join(' '),
          provider: { '@id': OFFICE_SCHEMA_IDS['mount-gambier'] },
          areaServed: { '@type': 'City', name: 'Mount Gambier', containedInPlace: { '@type': 'State', name: 'South Australia' } },
        }}
      />
      <PageHero
        eyebrow="Mount Gambier property management"
        title="Property management in Mount Gambier."
        lede={`${OFFICE.about} A named property manager you can reach directly, from our office at 178 Commercial Street East.`}
        photo={PHOTO?.photo ?? mountGambierStreet}
        photoAlt={PHOTO?.alt ?? 'Homes on a hillside street in Mount Gambier'}
        focalPoint={PHOTO ? undefined : '30% 65%'}
      >
        <div className="page-hero__actions">
          <a href="/mount-gambier/rental-appraisal/" className="btn btn-primary">
            Get a Rental Appraisal <Icon name="arrow" />
          </a>
          <a href={PHONE_TEL} className="btn btn-outline-light" onClick={() => trackCallClick('mount_gambier_pm_hero')}>
            <Icon name="phone" /> {PHONE_DISPLAY}
          </a>
        </div>
      </PageHero>

      <ProseSection eyebrow="Your local team" title="Mount Gambier landlords, looked after from Mount Gambier.">
        <p className="lede">
          Our Mount Gambier office is on Commercial Street East, and the people who manage your property work from it.
        </p>
        <p>
          <a href="/our-people/luke-whittaker/">Luke Whittaker</a>, our Region Manager for Mount Gambier, has spent his
          whole property management career with APN Real Estate. He’s known for navigating complex tenancies and
          resolving insurance claims, and his work spans residential property management, commercial sales and
          leasing, and residential sales support.
        </p>
        <p>
          <a href="/our-people/jenny-saffin/">Jenny Saffin</a> is a licensed property manager in the same office. She
          owns an investment property herself, so she manages other people’s properties the way she’d want her own
          managed.
        </p>
        <p>
          Whichever of them looks after your property, you’ll know who it is and how to reach them directly. Call{' '}
          <a href={PHONE_TEL} onClick={() => trackCallClick('mount_gambier_pm_copy')}>
            {PHONE_DISPLAY}
          </a>{' '}
          and ask for Luke or Jenny.
        </p>
      </ProseSection>

      <Team names={MOUNT_GAMBIER_PMS} credentials eyebrow="Property management" title="Your Mount Gambier property managers." />

      <Reasons eyebrow="Why landlords choose APN Real Estate" title="A property manager you can actually reach." items={LEASING_REASONS} dark />
      <Process eyebrow="How it works" title="From appraisal to a tenant in place." steps={LEASING_STEPS} />

      <Actions
        eyebrow="Landlords"
        title="Where to start."
        items={[
          { icon: 'chart', title: 'Free rental appraisal', copy: 'What your Mount Gambier property should lease for today.', href: '/mount-gambier/rental-appraisal/' },
          { icon: 'key', title: 'Changing property managers', copy: 'What’s involved, and how it works while your property is tenanted.', href: '/leasing/switching-property-managers/' },
          { icon: 'tag', title: 'Commercial property', copy: 'Offices, shops and other commercial space for lease in Mount Gambier.', href: '/commercial/' },
          { icon: 'home', title: 'What a property manager does', copy: 'Tenants, maintenance, rent and communication, explained.', href: '/blog/what-does-a-property-manager-do/' },
        ]}
      />

      <GoogleReviews id="reviews" />

      <Faq
        title="Questions Mount Gambier landlords ask us."
        items={LEASING_FAQS}
        more={
          <>
            Visit us at {OFFICE.addressLines.join(' ')} (<a href="/mount-gambier/">office details and map</a>), or see{' '}
            <a href="/leasing/">property management across Adelaide and Mount Gambier</a>.
          </>
        }
      />

      <FormSection
        id="appraisal"
        eyebrow="Free rental appraisal"
        title="What could your Mount Gambier property rent for?"
        copy="Tell us about your property. Luke or Jenny will review the details and contact you directly."
        steps={['We review your property', 'Your Mount Gambier property manager contacts you', 'You decide, with no obligation to appoint APN Real Estate']}
      >
        <EnquiryForm kind="rental-appraisal" submitLabel="Get My Free Rental Appraisal" />
      </FormSection>
      <CtaBand
        title="Let’s talk about your property."
        copy="Get a free rental appraisal, or call the Mount Gambier office for a chat about your property."
        href="#appraisal"
        label="Get a Rental Appraisal"
      />
    </Layout>
  );
}
