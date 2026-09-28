import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import { FormSection, PageHero } from '../components/sections';
import { STOCK } from '../data/media';

// No job listings are shown, and no claims about openings either way.
// If APN starts advertising roles, list them here with a link to each ad.

export default function Careers() {
  return (
    <Layout>
      <PageHero
        eyebrow="Careers"
        title="Work with APN."
        lede="We’re a local team across sales, leasing and property management in Adelaide and Mount Gambier."
        photo={STOCK.openPlan.photo}
        photoAlt={STOCK.openPlan.alt}
      />
      <FormSection
        id="interest"
        eyebrow="Expression of interest"
        title="Interested in joining us?"
        copy="Send us your details and tell us a little about yourself. We’ll keep them on file and get in touch if a suitable role comes up."
      >
        <EnquiryForm kind="careers" submitLabel="Send My Details" />
      </FormSection>
    </Layout>
  );
}
