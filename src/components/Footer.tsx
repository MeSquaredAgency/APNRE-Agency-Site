import logoReversed from '../assets/logo/adelaide-property-network-logo-reversed.png';
import { OFFICE_LIST } from '../data/offices';
import { NAV_GROUPS } from '../data/nav';
import {
  ABN,
  ACN,
  BUSINESS_NAME,
  LEGAL_ENTITY_NAME,
  PHONE_DISPLAY,
  PHONE_TEL,
  RLA_NUMBER,
} from '../data/business';
import { trackCallClick } from '../lib/analytics';

export default function Footer() {
  // Only details that are actually filled in (src/data/business.ts).
  const registration = [
    LEGAL_ENTITY_NAME,
    ABN && `ABN ${ABN}`,
    ACN && `ACN ${ACN}`,
    RLA_NUMBER && `RLA ${RLA_NUMBER}`,
  ].filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__top">
        <div className="site-footer__brand">
          <a href="/" className="site-footer__logo">
            <img src={logoReversed} alt="Adelaide Property Network — APN Real Estate" />
          </a>
          <a href={PHONE_TEL} className="site-footer__phone" onClick={() => trackCallClick('footer')}>
            {PHONE_DISPLAY}
          </a>
          <div className="site-footer__offices">
            {OFFICE_LIST.map((office) => (
              <p key={office.id}>
                <strong>{office.name}</strong>
                <br />
                {office.addressLines[0]} {office.addressLines[1]}
              </p>
            ))}
          </div>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="site-footer__title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="wrap site-footer__legal">
        <p>
          © {new Date().getFullYear()} {BUSINESS_NAME}
          {registration.length > 0 && <> · {registration.join(' · ')}</>}. Formerly Adelaide
          Property Network.
        </p>
        <p>Some photography and video is stock imagery from Pexels.</p>
        <a href="/privacy/">Privacy Policy</a>
      </div>
    </footer>
  );
}
