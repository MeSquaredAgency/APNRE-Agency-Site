import logoReversed from '../../assets/logo/adelaide-property-network-logo-reversed.png';
import { OFFICE_LIST } from '../data/offices';
import {
  ABN,
  ACN,
  BUSINESS_NAME,
  LEGAL_ENTITY_NAME,
  PHONE_DISPLAY,
  PHONE_TEL,
  RLA_NUMBER,
} from '../../data/business';

interface FooterProps {
  /** Where the footer CTA points. See Header's ctaHref. */
  ctaHref?: string;
}

export default function Footer({ ctaHref = '#appraisal' }: FooterProps) {
  // Only details that are actually filled in (src/data/business.ts).
  const registration = [
    LEGAL_ENTITY_NAME,
    ABN && `ABN ${ABN}`,
    ACN && `ACN ${ACN}`,
    RLA_NUMBER && `RLA ${RLA_NUMBER}`,
  ].filter(Boolean);

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <div className="site-footer__brand">
          <a href="/" className="site-footer__logo">
            {/* The main logo with its grey parts lightened so they read on
                charcoal; the green is unchanged. */}
            <img
              src={logoReversed}
              width={448}
              height={300}
              alt="Adelaide Property Network — APN Real Estate"
              loading="lazy"
              decoding="async"
            />
          </a>
          <p>Property management across Adelaide and Mount Gambier.</p>
        </div>

        {OFFICE_LIST.map((office) => (
          <div className="site-footer__col" key={office.id}>
            <p className="site-footer__heading"><a href={office.path}>{office.name}</a></p>
            <p>
              {office.addressLines[0]}
              <br />
              {office.addressLines[1]}
            </p>
          </div>
        ))}

        <div className="site-footer__col">
          <p className="site-footer__heading">Get in touch</p>
          <p>
            <a href={PHONE_TEL} className="site-footer__phone">{PHONE_DISPLAY}</a>
          </p>
          <a href={ctaHref} className="btn btn-outline-light site-footer__btn">
            Free Rental Appraisal
          </a>
        </div>
      </div>

      <div className="wrap site-footer__legal">
        <p>
          © {new Date().getFullYear()} {BUSINESS_NAME}
          {registration.length > 0 && <> · {registration.join(' · ')}</>}
          . Formerly Adelaide Property Network.
        </p>
        <nav className="site-footer__legal-links" aria-label="More">
          {__BLOG_HAS_POSTS__ && <a href="/blog/">Blog</a>}
          <a href="/privacy/">Privacy Policy</a>
        </nav>
      </div>
    </footer>
  );
}
