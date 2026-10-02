import logoReversed from '../../../assets/logo/adelaide-property-network-logo-reversed.png';
import Icon from '../../../components/Icon';
import { OFFICE_LIST } from '../../../data/offices';
import {
  ABN,
  ACN,
  BUSINESS_NAME,
  LEGAL_ENTITY_NAME,
  OPENING_HOURS,
  PHONE_DISPLAY,
  PHONE_TEL,
  RLA_NUMBER,
} from '../../../data/business';
import { trackCallClick } from '../../../lib/analytics';

// The main site's footer (src/components/Footer.tsx) without its site
// menu: the offices and phone number, then one way forward, the form.
// No stock-imagery note, since every photo on these pages is APN's own.
export default function Footer({ ctaHref }: { ctaHref: string }) {
  // Only details that are actually filled in (src/data/business.ts).
  const registration = [
    LEGAL_ENTITY_NAME,
    ABN && `ABN ${ABN}`,
    ACN && `ACN ${ACN}`,
    RLA_NUMBER && `RLA ${RLA_NUMBER}`,
  ].filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__top funnel-footer">
        <div className="site-footer__brand">
          <a href="/" className="site-footer__logo">
            <img
              src={logoReversed}
              alt="Adelaide Property Network — APN Real Estate"
              width={448}
              height={300}
              loading="lazy"
              decoding="async"
            />
          </a>
          <a href={PHONE_TEL} className="site-footer__phone" onClick={() => trackCallClick('footer')}>
            {PHONE_DISPLAY}
          </a>
          <p className="site-footer__hours">
            <span aria-hidden="true">Both offices: {OPENING_HOURS.display}</span>
            <span className="visually-hidden">Both offices are {OPENING_HOURS.spoken.toLowerCase()}</span>
          </p>
        </div>

        <div className="site-footer__offices funnel-footer__offices">
          {OFFICE_LIST.map((office) => (
            <p key={office.id}>
              <strong>{office.name}</strong>
              <br />
              {office.addressLines[0]}
              <br />
              {office.addressLines[1]}
            </p>
          ))}
        </div>

        <div className="funnel-footer__cta">
          <p className="site-footer__title">Property management across Adelaide and Mount Gambier.</p>
          <a href={ctaHref} className="btn btn-outline-light">
            Free Rental Appraisal <Icon name="arrow" />
          </a>
        </div>
      </div>

      <div className="wrap site-footer__legal">
        <p>
          © {new Date().getFullYear()} {BUSINESS_NAME}
          {registration.length > 0 && <> · {registration.join(' · ')}</>}. Formerly Adelaide
          Property Network.
        </p>
        <a href="/privacy/">Privacy Policy</a>
      </div>
    </footer>
  );
}
