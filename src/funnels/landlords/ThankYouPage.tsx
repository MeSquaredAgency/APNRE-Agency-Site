import Header, { FORM_HREF } from './components/Header';
import Footer from './components/Footer';
import Icon from '../../components/Icon';
import StickyActions from '../../components/StickyActions';
import { Offices, PageHero, Reasons } from '../../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../../data/business';
import { trackCallClick } from '../../lib/analytics';

// Where the landlord form lands (/landlords/thank-you/). It has no form
// of its own, so its buttons go back to the landing page's.
const FORM = `/landlords/${FORM_HREF}`;

const NEXT_STEPS = [
  { title: 'We review your property', copy: 'We look over the details you’ve given us and assess the property.' },
  { title: 'We contact you', copy: 'An APN property manager gets in touch directly.' },
  { title: 'You decide', copy: 'There’s no obligation to appoint APN.' },
];

export default function ThankYouPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header thankYou />
      <main id="main">
        <PageHero
          eyebrow="Thank you"
          title="We’ve got your details."
          lede="Your free rental appraisal request has been received. A local APN property manager will review your property and be in touch directly."
        >
          <div className="page-hero__actions">
            <a href={PHONE_TEL} className="btn btn-primary" onClick={() => trackCallClick('thank_you')}>
              <Icon name="phone" /> Need us sooner? {PHONE_DISPLAY}
            </a>
            <a href="/" className="btn btn-outline-light">
              Visit APN Real Estate
            </a>
          </div>
        </PageHero>
        <Reasons eyebrow="What happens next" title="Here’s what to expect." items={NEXT_STEPS} />
        <Offices title="Or contact either office directly." />
      </main>
      <Footer ctaHref={FORM} />
      <StickyActions current="/landlords/thank-you/" cta={{ href: FORM, label: 'Free Appraisal' }} />
    </>
  );
}
