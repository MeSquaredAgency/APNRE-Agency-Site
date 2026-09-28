import { PHONE_TEL } from '../../data/business';
import { trackCallClick } from '../lib/analytics';

// Two actions: landlords ready to switch often want to talk to a person
// straight away rather than fill in a form.
export default function StickyMobileCta({ ctaHref = '#appraisal' }: { ctaHref?: string }) {
  return (
    <div className="mobile-cta">
      <a href={PHONE_TEL} className="btn btn-outline-dark mobile-cta__call" onClick={() => trackCallClick('sticky_bar')}>
        Call
      </a>
      <a href={ctaHref} className="btn btn-primary mobile-cta__main">
        Free Rental Appraisal
      </a>
    </div>
  );
}
