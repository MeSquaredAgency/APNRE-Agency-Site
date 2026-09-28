import Header from './components/Header';
import Footer from './components/Footer';
import StickyMobileCta from './components/StickyMobileCta';
import { OFFICE_LIST } from './data/offices';
import { PHONE_DISPLAY, PHONE_TEL } from '../../data/business';

// The homepage's form, since this page has none of its own (same pattern
// as PrivacyPage.tsx).
const FORM_HREF = '/landlords/#appraisal';

export default function ThankYouPage() {
  return (
    <>
      <Header nav={[]} ctaHref={FORM_HREF} />
      <main id="top" className="section section-paper legal">
        <div className="wrap legal__inner">
          <span className="eyebrow">Thank you</span>
          <h1 className="h-1">We’ve got your details.</h1>
          <p className="lede">
            Your free rental appraisal request has been received. A local
            APN property manager will review your property and be in touch
            directly.
          </p>

          <div className="appraisal__steps">
            <span className="appraisal__steps-label">What happens next</span>
            <ol className="appraisal__steps-list">
              <li>
                <span className="appraisal__step-num">01</span>
                <div>
                  <h2 className="appraisal__step-title">We review your property</h2>
                  <p>We look over the details you’ve given us and assess the property.</p>
                </div>
              </li>
              <li>
                <span className="appraisal__step-num">02</span>
                <div>
                  <h2 className="appraisal__step-title">We contact you</h2>
                  <p>An APN property manager gets in touch directly.</p>
                </div>
              </li>
              <li>
                <span className="appraisal__step-num">03</span>
                <div>
                  <h2 className="appraisal__step-title">You decide</h2>
                  <p>There’s no obligation to appoint APN.</p>
                </div>
              </li>
            </ol>
          </div>

          <h2 className="h-3">Need to reach us sooner?</h2>
          <p>
            Call <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>, or contact either
            office directly:
          </p>
          <ul>
            {OFFICE_LIST.map((office) => (
              <li key={office.id}>
                <strong>{office.name}</strong> — {office.addressLines[0]}{' '}
                {office.addressLines[1]}
              </li>
            ))}
          </ul>

          <p>
            <a href="/">← Back to APN Real Estate</a>
          </p>
        </div>
      </main>
      <Footer ctaHref={FORM_HREF} />
      <StickyMobileCta ctaHref={FORM_HREF} />
    </>
  );
}
