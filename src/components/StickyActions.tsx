import { PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import Icon from './Icon';

/** Call / appraisal bar pinned to the bottom of the screen on phones
 *  (hidden above 760px, where the header has its own button). Left off
 *  the appraisal page, where the form is the whole page. */
export default function StickyActions({ current }: { current: string }) {
  if (current.startsWith('/appraisal/')) return null;
  return (
    <div className="sticky-actions">
      <a href={PHONE_TEL} className="sticky-actions__call" onClick={() => trackCallClick('sticky_bar')}>
        <Icon name="phone" /> Call
      </a>
      <a href="/appraisal/" className="sticky-actions__cta">
        Free Appraisal <Icon name="arrow" />
      </a>
    </div>
  );
}
