import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { PageHero } from '../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';

const MESSAGES: Record<string, string> = {
  'sales-appraisal': 'A member of our sales team will be in touch to arrange your appraisal.',
  'rental-appraisal': 'A local APN property manager will review your details and contact you directly.',
  'buyer-register': 'We’ll let you know when a property that suits comes up.',
  'tenant-register': 'Our property management team will be in touch if something suitable comes up.',
  careers: 'We’ve got your details and will be in touch if a suitable role comes up.',
  maintenance: 'Your property manager will be in touch to arrange the repair.',
};

export default function ThankYou() {
  const type = new URLSearchParams(window.location.search).get('type') ?? '';
  return (
    <Layout>
      <PageHero
        eyebrow="Thank you"
        title="We’ve got your details."
        lede={MESSAGES[type] ?? 'Someone from our team will get back to you soon.'}
      >
        <p className="page-hero__note">
          Need us sooner? Call <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>.
        </p>
        <div className="page-hero__actions">
          <a href="/" className="btn btn-primary">
            Back to Home <Icon name="arrow" />
          </a>
        </div>
      </PageHero>
    </Layout>
  );
}
