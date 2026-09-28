import { useEffect, useState } from 'react';
import { MAIN_LOGO, MAIN_LOGO_ALT, OFFICE_LIST, type OfficeId } from '../data/offices';
import { PHONE_DISPLAY, PHONE_TEL } from '../../../data/business';
import { trackCallClick } from '../lib/analytics';

export interface NavLink {
  href: string;
  label: string;
}

const HOME_NAV: NavLink[] = [
  { href: '#why-apn', label: 'Why APN' },
  { href: '#team', label: 'The Team' },
  { href: '#switch', label: 'Switching?' },
  { href: '#faq', label: 'FAQ' },
];

interface HeaderProps {
  /** In-page section links. Defaults to the homepage's. */
  nav?: NavLink[];
  /** Set on an office page so its own office link is marked current and
   *  the logo links back to the homepage instead of the top of the page. */
  currentOffice?: OfficeId;
  /** Where the header CTA points. Pages without the form (e.g. the privacy
   *  policy) send it to the homepage's form instead. */
  ctaHref?: string;
}

export default function Header({ nav = HOME_NAV, currentOffice, ctaHref = '#appraisal' }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const office = OFFICE_LIST.find((o) => o.id === currentOffice);
  const logo = office ? office.logo : MAIN_LOGO;
  const isHome = nav === HOME_NAV;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the menu on Escape, and if the window grows past the point
  // where the inline nav takes over.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    const wide = window.matchMedia('(min-width: 1181px)');
    const onWide = () => wide.matches && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className={`site-header${scrolled || menuOpen ? ' is-scrolled' : ''}`}>
      <div className="wrap site-header__row">
        <a href={isHome ? '#top' : '/'} className="site-header__brand" aria-label="APN Real Estate — home">
          {/* Stacked logos (mark over wordmark) need the height to stay
              legible. */}
          <img
            src={logo.src}
            width={logo.width}
            height={logo.height}
            alt={office ? office.logoAlt : MAIN_LOGO_ALT}
            className="site-header__logo"
          />
        </a>
        <nav className="site-header__nav" aria-label="Primary">
          {nav.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
          {nav.length > 0 && <span className="site-header__nav-divider" aria-hidden="true" />}
          {/* Off the homepage, a plain "Home" link — the logo alone isn't
              an obvious way back to the landing page. */}
          {!isHome && <a href="/">Home</a>}
          {OFFICE_LIST.map((o) => (
            <a
              href={o.path}
              key={o.id}
              className="site-header__office-link"
              aria-current={o.id === currentOffice ? 'page' : undefined}
            >
              {o.name}
            </a>
          ))}
        </nav>
        <div className="site-header__actions">
          <a href={ctaHref} className="btn btn-primary site-header__cta">
            Free Rental Appraisal
          </a>
          <button
            type="button"
            className="site-header__toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="site-header__toggle-bars" aria-hidden="true" />
            <span className="site-header__toggle-label">{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>

      <div id="site-menu" className="site-menu" hidden={!menuOpen}>
        <nav className="wrap site-menu__inner" aria-label="Menu">
          {!isHome && (
            <ul className="site-menu__list">
              <li>
                <a href="/" className="site-menu__home">
                  ← APN Real Estate home
                </a>
              </li>
            </ul>
          )}
          {nav.length > 0 && (
            <ul className="site-menu__list">
              {nav.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={close}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="site-menu__label">Our offices</p>
          <ul className="site-menu__list">
            {OFFICE_LIST.map((o) => (
              <li key={o.id}>
                <a href={o.path} onClick={close} aria-current={o.id === currentOffice ? 'page' : undefined}>
                  {o.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="site-menu__actions">
            <a href={PHONE_TEL} className="btn btn-outline-dark" onClick={() => trackCallClick('header_menu')}>
              Call {PHONE_DISPLAY}
            </a>
            <a href={ctaHref} className="btn btn-primary" onClick={close}>
              Free Rental Appraisal
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
