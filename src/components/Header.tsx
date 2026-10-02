import { useEffect, useRef, useState } from 'react';
import { MAIN_LOGO_ALT } from '../data/offices';
import logoReversed from '../assets/logo/adelaide-property-network-logo-reversed.png';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { NAV_GROUPS, PRIMARY_NAV, type NavLink } from '../data/nav';
import { trackCallClick } from '../lib/analytics';
import Icon from './Icon';

interface HeaderProps {
  /** Path of the current page, to mark its nav link. */
  current: string;
  /** Home starts transparent over the hero video. */
  overlay?: boolean;
  /** A campaign funnel's header (src/funnels/): only that page's own
   *  links and button, so ad visitors aren't sent off around the site. */
  funnel?: FunnelNav;
}

export interface FunnelNav {
  /** Where the logo goes, e.g. the top of the page. */
  home: string;
  /** In-page links, shown in the header and the menu. */
  links: NavLink[];
  cta: NavLink;
}

const MAIN_CTA: NavLink = { href: '/appraisal/', label: 'Book a Free Appraisal' };

export default function Header({ current, overlay = false, funnel }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // While the menu is open: lock page scroll behind it, close it on
  // Escape, move focus into it, and keep Tab cycling between the menu and
  // its close button, so keyboard users can't tab into the page hidden
  // behind it. When it closes, focus goes back to the menu button.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) menuButton.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    document.body.style.overflow = 'hidden';
    // Screen readers' swipe navigation ignores the focus trap below, so
    // take the page behind the menu out of reach entirely.
    const behind = Array.from(document.querySelectorAll<HTMLElement>('.skip-link, #main, .site-footer, .sticky-actions'));
    behind.forEach((el) => el.setAttribute('inert', ''));
    const focusables = () => [
      menuButton.current!,
      ...Array.from(menu.current?.querySelectorAll<HTMLElement>('a[href], button') ?? []),
    ];
    focusables()[1]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
      e.preventDefault();
      items[next].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      behind.forEach((el) => el.removeAttribute('inert'));
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const solid = !overlay || scrolled || open;
  const links = funnel ? funnel.links : PRIMARY_NAV;
  const cta = funnel ? funnel.cta : MAIN_CTA;

  return (
    <header className={`site-header${solid ? ' is-solid' : ''}${funnel ? ' site-header--funnel' : ''}`}>
      <div className="wrap site-header__row">
        <a href={funnel ? funnel.home : '/'} className="site-header__brand" aria-label="APN Real Estate — home">
          {/* width/height are the file's own size, so the browser keeps
              the space before it loads; CSS sets the displayed height. */}
          <img src={logoReversed} alt={MAIN_LOGO_ALT} className="site-header__logo" width={448} height={300} />
        </a>

        <nav className="site-header__nav" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} aria-current={current === link.href ? 'page' : undefined}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          {funnel && (
            <a href={PHONE_TEL} className="site-header__phone" onClick={() => trackCallClick('header')}>
              <Icon name="phone" /> {PHONE_DISPLAY}
            </a>
          )}
          <a href={cta.href} className="btn btn-light btn-sm site-header__cta">
            {cta.label}
          </a>
          <button
            type="button"
            ref={menuButton}
            className="site-header__menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={26} />
          </button>
        </div>
      </div>

      <div id="site-menu" ref={menu} className="site-menu" hidden={!open}>
        <div className="wrap site-menu__inner">
          {funnel ? (
            <ul className="site-menu__links">
              {funnel.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="site-menu__groups">
              {NAV_GROUPS.map((group) => (
                <div className="site-menu__group" key={group.title}>
                  <a href={group.href} className="site-menu__title" onClick={() => setOpen(false)}>
                    {group.title}
                  </a>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link.href + link.label}>
                        <a
                          href={link.href}
                          aria-current={current === link.href ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div className="site-menu__foot">
            <a href={PHONE_TEL} className="site-menu__phone" onClick={() => trackCallClick('menu')}>
              <Icon name="phone" /> {PHONE_DISPLAY}
            </a>
            <a href={cta.href} className="btn btn-light" onClick={() => setOpen(false)}>
              {cta.label} <Icon name="arrow" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
