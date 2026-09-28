import { useEffect, useState } from 'react';
import { PHONE_TEL } from '../../../data/business';
import { trackCallClick } from '../lib/analytics';

// Two actions: landlords ready to switch often want to talk to a person
// straight away rather than fill in a form.
//
// Slides in once the hero has scrolled up past it. While the hero is on
// screen its own two buttons are right there, and a bar pinned to the
// bottom of the screen would sit over them on most phones.
const BAR_HEIGHT = 80;
const SCROLLED = 40;
export default function StickyMobileCta({ ctaHref = '#appraisal' }: { ctaHref?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // The landing page's hero. The thank-you page has none, so it shows
    // the bar as soon as the visitor scrolls.
    const hero = document.querySelector('.hero');
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

  return (
    <div className={`mobile-cta${visible ? ' is-visible' : ''}`} aria-hidden={!visible || undefined}>
      <a
        href={PHONE_TEL}
        className="btn btn-outline-dark mobile-cta__call"
        onClick={() => trackCallClick('sticky_bar')}
        tabIndex={visible ? undefined : -1}
      >
        Call
      </a>
      <a href={ctaHref} className="btn btn-primary mobile-cta__main" tabIndex={visible ? undefined : -1}>
        Free Rental Appraisal
      </a>
    </div>
  );
}
