import { useEffect, useRef, useState } from 'react';
import { MAIN_LOGO_ALT } from '../data/offices';
import logoReversed from '../assets/logo/adelaide-property-network-logo-reversed.png';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { NAV_GROUPS, PRIMARY_NAV } from '../data/nav';
import { trackCallClick } from '../lib/analytics';
import Icon from './Icon';

interface HeaderProps {
  /** Path of the current page, to mark its nav link. */
  current: string;
  /** Home starts transparent over the hero video. */
  overlay?: boolean;
}

export default function Header({ current, overlay = false }: HeaderProps) {
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
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const solid = !overlay || scrolled || open;

  return (
    <header className={`site-header${solid ? ' is-solid' : ''}`}>
      <div className="wrap site-header__row">
        <a href="/" className="site-header__brand" aria-label="APN Real Estate — home">
          <img src={logoReversed} alt={MAIN_LOGO_ALT} className="site-header__logo" />
        </a>

        <nav className="site-header__nav" aria-label="Primary">
          {PRIMARY_NAV.map((link) => (
            <a key={link.href} href={link.href} aria-current={current === link.href ? 'page' : undefined}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <a href="/appraisal/" className="btn btn-light btn-sm site-header__cta">
            Free Appraisal
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
          <div className="site-menu__foot">
            <a href={PHONE_TEL} className="site-menu__phone" onClick={() => trackCallClick('menu')}>
              <Icon name="phone" /> {PHONE_DISPLAY}
            </a>
            <a href="/appraisal/" className="btn btn-light">
              Book a Free Appraisal <Icon name="arrow" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
