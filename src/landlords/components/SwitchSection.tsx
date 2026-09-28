import balconyWide from '../../assets/photos/balcony-view-wide.jpg?photo';
import Picture from '../../components/Picture';
import { SWITCHING_EVENT } from './AppraisalForm';
import { PHONE_DISPLAY, PHONE_TEL } from '../../data/business';
import { trackCallClick } from '../lib/analytics';

export default function SwitchSection() {
  return (
    <section id="switch" className="switch">
      <div className="switch__media">
        <Picture photo={balconyWide} alt="Balcony view from a property managed by APN" />
        <div className="switch__scrim" />
      </div>

      <div className="wrap switch__inner">
        <span className="eyebrow">Already have a property manager?</span>
        <h2 className="h-display switch__headline">
          Thinking about
          <br />a change?
        </h2>
        <p className="lede switch__lede">
          Changing property managers is a straightforward process. Tell us
          about your property and we’ll explain what’s involved, including
          how the transition works while your property is tenanted.
        </p>
        <div className="switch__actions">
          <a
            href="#appraisal"
            className="btn btn-primary"
            onClick={() => window.dispatchEvent(new Event(SWITCHING_EVENT))}
          >
            Talk to APN About Switching
          </a>
          <a href={PHONE_TEL} className="btn btn-outline-light" onClick={() => trackCallClick('switch_section')}>
            Or call {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
