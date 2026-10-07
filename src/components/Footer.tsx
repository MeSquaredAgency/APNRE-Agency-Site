import logoReversed from '../assets/logo/adelaide-property-network-logo-reversed.png';
import { OFFICE_LIST } from '../data/offices';
import { NAV_GROUPS } from '../data/nav';
import { SIDE_LOGO_REVERSED } from '../data/supplied';
import {
  ABN,
  ACN,
  BUSINESS_NAME,
  LEGAL_ENTITY_NAME,
  LICENSEE_LINE,
  OPENING_HOURS,
  PHONE_DISPLAY,
  PHONE_TEL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../data/business';
import { trackCallClick, trackWhatsAppClick } from '../lib/analytics';
import Icon from './Icon';
import { FollowUs } from './sections';

export default function Footer() {
  // Only details that are actually filled in (src/data/business.ts).
  const registration = [LEGAL_ENTITY_NAME, ABN && `ABN ${ABN}`, ACN && `ACN ${ACN}`].filter(Boolean);
  const logo = SIDE_LOGO_REVERSED ?? { src: logoReversed, width: 448, height: 300 };

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__top">
        <div className="site-footer__brand">
          <a href="/" className={`site-footer__logo${SIDE_LOGO_REVERSED ? ' site-footer__logo--side' : ''}`}>
            <img
              src={logo.src}
              alt="Adelaide Property Network — APN Real Estate"
              width={logo.width}
              height={logo.height}
              loading="lazy"
              decoding="async"
            />
          </a>
          <a href={PHONE_TEL} className="site-footer__phone" onClick={() => trackCallClick('footer')}>
            {PHONE_DISPLAY}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer__whatsapp"
            onClick={() => trackWhatsAppClick('footer')}
          >
            <Icon name="whatsapp" /> WhatsApp {WHATSAPP_DISPLAY}
            <span className="visually-hidden"> (opens WhatsApp)</span>
          </a>
          <p className="site-footer__hours">
            <span aria-hidden="true">Both offices: {OPENING_HOURS.display}</span>
            <span className="visually-hidden">Both offices are {OPENING_HOURS.spoken.toLowerCase()}</span>
          </p>
          <div className="site-footer__offices">
            {OFFICE_LIST.map((office) => (
              <p key={office.id}>
                <strong>{office.name}</strong>
                <br />
                {office.addressLines[0]} {office.addressLines[1]}
              </p>
            ))}
          </div>
          <FollowUs className="follow-us--dark" />
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="site-footer__title">{group.title}</p>
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
          {/* SA requires the licensee's name and RLA number on all
              marketing, so this line is on every page. */}
          <span className="site-footer__licensee">{LICENSEE_LINE}</span>
          {registration.length > 0 && <> · {registration.join(' · ')}</>} · © {new Date().getFullYear()}{' '}
          {BUSINESS_NAME}
        </p>
        <p>Some photography and video is stock imagery from Pexels.</p>
        <a href="/privacy/">Privacy Policy</a>
        <PoweredBy />
      </div>
    </footer>
  );
}

/** The site builder's credit. There's no Me² logo file yet, so the mark
 *  is set in type: "me" plus a coral "²", as on Me²'s own site.
 *  TODO(supplied-assets): swap in the me² logo file once there is one. */
export function PoweredBy() {
  return (
    <a className="powered-by" href="https://mesquaredagency.com" target="_blank" rel="noopener">
      <span className="powered-by__mark" aria-hidden="true">
        me<sup>²</sup>
      </span>
      Powered by Me² Agency
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
