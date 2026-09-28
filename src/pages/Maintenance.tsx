import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Icon from '../components/Icon';
import { FormSection, PageHero } from '../components/sections';
import { MAINTENANCE_FORM_ENABLED, PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';

// The form only appears once MAINTENANCE_FORM_ENABLED is switched on in
// src/data/business.ts. Until then, tenants are told to call.

export default function Maintenance() {
  return (
    <Layout>
      <PageHero
        eyebrow="For tenants"
        title="Repairs & maintenance."
        lede="Renting through APN and something needs fixing? Here’s how to let us know."
      >
        <div className="page-hero__actions">
          <a href={PHONE_TEL} className="btn btn-primary" onClick={() => trackCallClick('maintenance_hero')}>
            <Icon name="phone" /> Call {PHONE_DISPLAY}
          </a>
        </div>
      </PageHero>

      <section className="section section-white">
        <div className="wrap notice-grid">
          <div className="notice notice--urgent">
            <h2 className="h-3">Urgent repairs</h2>
            <p>
              If something is unsafe or could cause serious damage, such as a
              burst pipe, a gas leak, no power or a security problem, call us
              straight away on <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>. Don’t
              use a form for urgent repairs.
            </p>
            <p>
              <strong>If anyone is in danger, call 000 first.</strong>
            </p>
          </div>
          <div className="notice">
            <h2 className="h-3">Everything else</h2>
            <p>
              {MAINTENANCE_FORM_ENABLED
                ? 'For non-urgent repairs, use the form below or contact your property manager. Include as much detail as you can.'
                : `For non-urgent repairs, contact your property manager or call us on ${PHONE_DISPLAY}. Have the property address and a description of the problem ready.`}
            </p>
          </div>
        </div>
      </section>

      {MAINTENANCE_FORM_ENABLED && (
        <FormSection
          id="request"
          eyebrow="Non-urgent repairs"
          title="Report a repair."
          copy="Tell us what’s wrong and where. Your property manager will be in touch to arrange it."
        >
          <EnquiryForm kind="maintenance" submitLabel="Send Repair Request" />
        </FormSection>
      )}
    </Layout>
  );
}
