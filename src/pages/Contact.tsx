import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import { FormSection, Offices, PageHero } from '../components/sections';
import { BLAIR_ATHOL_PHOTOS } from '../data/offices';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';

export default function Contact() {
  return (
    <Layout>
      <PageHero
        eyebrow="Contact us"
        title="Get in touch."
        lede="Call either office on one number, Monday to Saturday from 8:30am to 5:00pm, or send us an enquiry and the right person will get back to you."
        photo={BLAIR_ATHOL_PHOTOS.reception.photo}
        photoAlt={BLAIR_ATHOL_PHOTOS.reception.alt}
      >
        <div className="page-hero__actions">
          <a href={PHONE_TEL} className="btn btn-primary" onClick={() => trackCallClick('contact_hero')}>
            <Icon name="phone" /> {PHONE_DISPLAY}
          </a>
          <a href="#enquiry" className="btn btn-outline-light">
            Send an Enquiry
          </a>
        </div>
      </PageHero>
      <Offices title="Visit us." />
      <FormSection
        id="enquiry"
        eyebrow="Send an enquiry"
        title="How can we help?"
        copy="Selling, buying, renting or property management: tell us a little about what you need."
      >
        <EnquiryForm kind="general" submitLabel="Send Enquiry" />
      </FormSection>
    </Layout>
  );
}
