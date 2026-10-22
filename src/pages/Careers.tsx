import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import JsonLd from '../components/JsonLd';
import { FormSection, PageHero } from '../components/sections';
import { BLAIR_ATHOL_PHOTOS } from '../data/offices';
import { webPage } from '../structured-data';

// No job listings are shown, and no claims about openings either way.
// If APN starts advertising roles, list them here with a link to each ad.

export default function Careers() {
  return (
    <Layout>
      {/* A WebPage, not a JobPosting: there are no openings listed. */}
      <JsonLd data={webPage({ path: '/careers/', name: 'Careers at APN Real Estate' })} />
      <PageHero
        eyebrow="Careers"
        title="Work with APN Real Estate."
        lede="We’re a local team across sales, leasing and property management in Adelaide and Mount Gambier."
        photo={BLAIR_ATHOL_PHOTOS.lounge.photo}
        photoAlt={BLAIR_ATHOL_PHOTOS.lounge.alt}
      />
      <FormSection
        id="interest"
        eyebrow="Expression of interest"
        title="Interested in joining us?"
        copy={
          <>
            Send us your details and tell us a little about yourself. We’ll keep them on file and get in touch if a
            suitable role comes up. Meanwhile, read <a href="/our-story/">our story</a> or{' '}
            <a href="/our-people/">meet the team</a>.
          </>
        }
      >
        <EnquiryForm kind="careers" submitLabel="Send My Details" />
      </FormSection>
    </Layout>
  );
}
