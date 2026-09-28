import Layout from '../components/Layout';
import { OFFICE_LIST } from '../data/offices';
import { BUSINESS_NAME, PHONE_DISPLAY, PHONE_TEL, PRIVACY_EMAIL } from '../data/business';

// Adapted from the landlord landing page's policy, and written from what
// this site actually collects and where it goes: the forms
// (functions/api/enquiry.ts → Google Sheet), Cloudflare hosting, and
// GTM / GA4 / Meta Pixel (src/partials/head-shared.html). If any of that
// changes (a new form, a CRM, another ad platform), update this page in
// the same change.
const LAST_UPDATED = '28 September 2026';

export default function Privacy() {
  return (
    <Layout>
      <section className="section section-white legal">
        <div className="wrap legal__inner">
          <span className="eyebrow">Legal</span>
          <h1 className="h-1">Privacy Policy</h1>
          <p className="legal__updated">Last updated {LAST_UPDATED}</p>

          <p className="lede">
            {BUSINESS_NAME} (“APN”, “we”, “us”) respects your privacy. This
            policy explains what personal information we collect through
            this website, why, and what we do with it. We handle personal
            information in line with the Australian Privacy Principles in
            the <em>Privacy Act 1988</em> (Cth).
          </p>

          <h2 className="h-3">What we collect</h2>
          <p>When you send us an enquiry or fill in a form on this site, we collect:</p>
          <ul>
            <li>your name, email address and phone number</li>
            <li>a property address, for appraisals and repair requests</li>
            <li>
              the details the form asks for, such as the suburbs and budget
              you’re looking in, when you’re thinking of selling, or whether a
              property is currently managed
            </li>
            <li>anything else you choose to write in the message field</li>
          </ul>
          <p>
            We also collect information about how you use the site, such as
            the pages you visit, the device and browser you use, and how you
            arrived (for example, from an ad). This is collected through
            cookies and similar technologies, described below.
          </p>

          <h2 className="h-3">Why we collect it</h2>
          <p>We use your information to:</p>
          <ul>
            <li>respond to your enquiry, including preparing an appraisal</li>
            <li>let you know about suitable properties, if you’ve asked us to</li>
            <li>arrange repairs, if you’re a tenant who has reported one</li>
            <li>consider you for a role, if you’ve sent an expression of interest</li>
            <li>keep a record of your enquiry</li>
            <li>understand how the website and our advertising perform, so we can improve them</li>
          </ul>
          <p>
            We won’t sell your personal information. We won’t add you to a
            mailing list without your agreement.
          </p>

          <h2 className="h-3">Who we share it with</h2>
          <p>
            We share information only with the service providers who help
            us run this website and handle enquiries:
          </p>
          <ul>
            <li><strong>Cloudflare</strong>, which hosts the website and processes form submissions</li>
            <li><strong>Google</strong>, where enquiries are stored (Google Sheets) and which provides website analytics (Google Analytics and Google Tag Manager)</li>
            <li><strong>Meta</strong> (Facebook and Instagram), which measures the performance of our ads through the Meta Pixel</li>
          </ul>
          <p>
            These providers may store or process information outside
            Australia, including in the United States. We may also disclose
            information where the law requires or allows it.
          </p>
          <p>
            Links to realestate.com.au take you to a separate website with
            its own privacy policy.
          </p>

          <h2 className="h-3">Cookies, analytics and advertising</h2>
          <p>
            This site uses Google Analytics to understand how visitors use
            it, and the Meta Pixel to measure whether our Facebook and
            Instagram ads lead to enquiries. Both use cookies. They may
            record that you submitted a form, but they don’t receive the
            details you type into it.
          </p>
          <p>
            You can block or delete cookies in your browser settings. You
            can also opt out of Google Analytics with Google’s{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
              opt-out browser add-on
            </a>{' '}
            and manage ad preferences in your{' '}
            <a href="https://www.facebook.com/adpreferences" target="_blank" rel="noopener noreferrer">
              Facebook ad settings
            </a>
            .
          </p>

          <h2 className="h-3">Keeping it secure</h2>
          <p>
            We take reasonable steps to protect personal information from
            misuse, loss and unauthorised access. Access to enquiries is
            limited to APN staff who need it. When we no longer need
            information, we take reasonable steps to delete it or
            de-identify it.
          </p>

          <h2 className="h-3">Accessing or correcting your information</h2>
          <p>
            You can ask to see the personal information we hold about you,
            or ask us to correct or delete it. Contact us using the details
            below. We’ll respond within a reasonable time, usually 30 days.
          </p>

          <h2 className="h-3">Complaints</h2>
          <p>
            If you have a concern about how we’ve handled your personal
            information, please contact us first so we can try to resolve
            it. If you’re not satisfied with our response, you can
            complain to the Office of the Australian Information
            Commissioner at{' '}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">oaic.gov.au</a>.
          </p>

          <h2 className="h-3">Contact us</h2>
          <p>
            Phone <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
            {PRIVACY_EMAIL && (
              <>
                {' '}or email <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
              </>
            )}
            , or write to us at either office:
          </p>
          <ul>
            {OFFICE_LIST.map((office) => (
              <li key={office.id}>
                {BUSINESS_NAME}, {office.addressLines[0]} {office.addressLines[1]}
              </li>
            ))}
          </ul>

          <h2 className="h-3">Changes to this policy</h2>
          <p>
            We may update this policy from time to time. The latest version
            will always be on this page.
          </p>
        </div>
      </section>
    </Layout>
  );
}
