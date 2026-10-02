import { useEffect, useState } from 'react';
import { PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import Icon from './Icon';

/** Call / appraisal bar pinned to the bottom of the screen on phones
 *  (hidden above 760px, where the header has its own button). Left off
 *  the appraisal page, where the form is the whole page.
 *
 *  It slides in once the page's hero has scrolled up past it: while the
 *  hero is on screen it has its own buttons, and a bar pinned over the
 *  bottom of it would cover them. */
const BAR_HEIGHT = 72;
const SCROLLED = 40;
export default function StickyActions({ current, cta: ownCta }: { current: string; cta?: { href: string; label: string } }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The page's hero, if it has one. Pages without one (privacy, legal
    // text) show the bar as soon as the visitor scrolls.
    const hero = document.querySelector('main .video-hero, main .page-hero, main .post__head');
    // Visible once the visitor has started scrolling (so every page opens
    // on a clean first screen) and, if there's a hero, once its bottom
    // edge is above where the bar sits, so the bar never covers the
    // hero's own buttons.
    const update = () =>
      setVisible(
        window.scrollY > SCROLLED && (!hero || hero.getBoundingClientRect().bottom < window.innerHeight - BAR_HEIGHT),
      );
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  if (current.startsWith('/appraisal/')) return null;
  // Office space tenants aren't after an appraisal: send them to the
  // booking form instead. A funnel passes its own (its form on the page).
  const cta =
    ownCta ??
    (current === '/office-space/' ? { href: '#book', label: 'Book a Room' } : { href: '/appraisal/', label: 'Free Appraisal' });
  return (
    <aside
      className={`sticky-actions${visible ? ' is-visible' : ''}`}
      aria-label="Quick actions"
      aria-hidden={!visible || undefined}
    >
      <a
        href={PHONE_TEL}
        className="sticky-actions__call"
        onClick={() => trackCallClick('sticky_bar')}
        tabIndex={visible ? undefined : -1}
      >
        <Icon name="phone" /> Call
      </a>
      <a href={cta.href} className="sticky-actions__cta" tabIndex={visible ? undefined : -1}>
        {cta.label} <Icon name="arrow" />
      </a>
    </aside>
  );
}
