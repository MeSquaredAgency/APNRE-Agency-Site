import Header, { FORM_HREF } from './components/Header';
import Footer from './components/Footer';
import AppraisalForm, { pickPropertyType, SWITCHING_EVENT } from './components/AppraisalForm';
import Icon from '../../components/Icon';
import Picture from '../../components/Picture';
import StickyActions from '../../components/StickyActions';
import { CtaBand, Faq, FormSection, Offices, PageHero, Pillars, SectionHead, Team } from '../../components/sections';
import { PHONE_DISPLAY, PHONE_TEL } from '../../data/business';
import { REVIEWS_URL } from '../../data/nav';
import { trackCallClick } from '../../lib/analytics';
import heroPhoto from '../../assets/photos/balcony-view-hills.jpg?photo';
import balconyWide from '../../assets/photos/balcony-view-wide.jpg?photo';
import interiorPhoto from '../../assets/photos/interior-corner-windows.jpg?photo';

// The landlord campaign page at apnre.com.au/landlords/, for paid ad
// traffic. Built from the main site's sections and styles so it looks
// like the rest of apnre.com.au, with its own copy (already signed off
// by APN, and shared with /leasing/: keep the two in step), form and
// analytics. Every link stays on this page apart from the privacy
// policy, the logo and the reviews.

// Facts APN can stand behind today, in the words used elsewhere on the
// page. No figures (reviews, leases, years) unless they're verified and
// kept current.
const PILLARS = [
  { title: 'Two local offices', copy: 'Blair Athol in Adelaide’s north, and Commercial Street East in Mount Gambier.' },
  { title: 'A named manager', copy: 'You’ll know who’s looking after your property and how to reach them directly.' },
  { title: 'Switching managers', copy: 'A straightforward process that doesn’t need to disrupt an existing tenancy.' },
  { title: 'Free appraisal', copy: 'Find out what your property could rent for, with no obligation to appoint APN Real Estate.' },
];

const PROBLEMS = [
  {
    title: 'The workload',
    copy: 'Vacancies, maintenance, inspections, arrears and day-to-day tenant communication all take time — time most landlords don’t have.',
  },
  {
    title: 'The silence',
    copy: 'You shouldn’t have to chase your property manager to find out what’s happening with your own property.',
  },
  {
    title: 'The uncertainty',
    copy: 'You should understand what’s happening with your property, why it’s happening and what comes next.',
  },
];

const REASONS = [
  {
    title: 'People on the ground. Local property knowledge.',
    copy: 'APN Real Estate operates across Adelaide and Mount Gambier, with people on the ground in both markets.',
  },
  {
    title: 'Know exactly who’s looking after it.',
    copy: 'You’ll know who is responsible for your property and how to reach them directly.',
  },
  {
    title: 'You own the property. You make the decisions.',
    copy: 'Our job is to manage the property professionally, keep you informed and give you the information you need to make your own decisions.',
  },
];

const FAQS = [
  {
    q: 'What does APN Real Estate’s property management service include?',
    a: 'Finding and screening tenants, collecting rent, routine and entry/exit inspections, coordinating maintenance and repairs, and keeping you informed about your property. Get in touch and your property manager can walk you through what that looks like for your specific property.',
  },
  {
    q: 'What happens when something needs repairing?',
    a: 'Your property manager coordinates qualified tradespeople to get it sorted and keeps you informed about what’s happening and why. If you’d like the specifics of how repairs are handled for your property, ask your property manager directly.',
  },
  {
    q: 'How much does property management cost?',
    a: 'Management fees vary depending on your property and what you need. Get in touch and we’ll give you a straight answer for your specific property.',
  },
  {
    q: 'Can I change property managers if my property is currently tenanted?',
    a: 'Yes — it’s a normal process and doesn’t need to disrupt an existing tenancy. Tell us your situation and we’ll explain how it would work for your property.',
  },
  {
    q: 'Who will manage my property, and can I speak to them directly?',
    a: 'A named property manager from our team. You’ll know who they are and be able to reach them directly.',
  },
  {
    q: 'Can APN Real Estate manage my property if I live interstate?',
    a: 'Get in touch with the details of your property and where you’re based, and we’ll let you know how we can help.',
  },
  {
    q: 'How quickly can my property be leased?',
    a: 'This depends on the property, the market, and the time of year. Ask us for a rental appraisal and we’ll give you a realistic view for your property.',
  },
];

/** "Switching" buttons also pre-pick "Yes, by another agent" on the form. */
const pickSwitching = () => window.dispatchEvent(new Event(SWITCHING_EVENT));

function Problem() {
  return (
    <section className="section section-white" id="pain">
      <div className="wrap">
        <SectionHead
          eyebrow="The landlord experience"
          title="You didn’t buy an investment property to consume more of your time."
        />
        <ol className="reasons">
          {PROBLEMS.map((p, i) => (
            <li key={p.title}>
              <span className="reasons__num">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="h-3">{p.title}</h3>
              <p>{p.copy}</p>
            </li>
          ))}
        </ol>
        {/* Patrick's words, 9 Oct 2026. */}
        <div className="funnel-bridge">
          <p>We make your active investment passive income.</p>
          <p className="funnel-bridge__sub">
            Our professional property managers will present you with choices, so you can make an informed decision.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhyApn() {
  return (
    <section className="section section-dark" id="why-apn">
      <div className="wrap story__grid funnel-why">
        <div>
          <span className="eyebrow">Why landlords choose APN Real Estate</span>
          <h2 className="h-1">A property manager you can actually reach.</h2>
          <ol className="reasons">
            {REASONS.map((r, i) => (
              <li key={r.title}>
                <span className="reasons__num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="h-3">{r.title}</h3>
                <p>{r.copy}</p>
              </li>
            ))}
          </ol>
          <p className="funnel-why__founder">
            APN Real Estate was founded by Patrick Nhim, who also leads the business’s sales side — so property
            management here sits alongside a working view of the local market, not apart from it.
          </p>
          <a href={FORM_HREF} className="btn btn-primary">
            Get My Free Rental Appraisal <Icon name="arrow" />
          </a>
        </div>
        <figure className="funnel-why__media">
          <Picture
            photo={interiorPhoto}
            alt="Interior of a property managed by APN Real Estate, with floor-to-ceiling windows"
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <figcaption>Real properties, looked after by a local team.</figcaption>
        </figure>
      </div>
    </section>
  );
}

// Reviews change over time, and a stale number on a live campaign page is
// worse than none, so this links to the live profile rather than quoting
// a rating or count.
function Proof() {
  return (
    <section className="section section-paper" id="proof">
      <div className="wrap prose-grid">
        <span className="eyebrow">Proof, not promises</span>
        <div className="prose">
          <h2 className="h-1">Real people. Real properties. Real accountability.</h2>
          <p className="lede">
            You’ll know the name of the property manager looking after your property, and how to reach them directly.
            For feedback on our service specifically, the most current source is our reviews — not a number quoted
            on this page.
          </p>
          <p>
            <a href={REVIEWS_URL} className="btn btn-outline-dark" target="_blank" rel="noopener noreferrer">
              See Our Reviews on realestate.com.au <Icon name="external" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function Switching() {
  return (
    <section className="photo-band" id="switch">
      <Picture photo={balconyWide} alt="" className="photo-band__img" />
      <div className="photo-band__scrim" />
      <div className="wrap photo-band__inner">
        <span className="eyebrow">Already have a property manager?</span>
        <h2 className="h-display">Thinking about a change?</h2>
        <p className="lede">
          Changing property managers is a straightforward process. Tell us about your property and we’ll explain
          what’s involved, including how the transition works while your property is tenanted.
        </p>
        <div className="page-hero__actions">
          <a href={FORM_HREF} className="btn btn-primary" onClick={pickSwitching}>
            Talk to APN Real Estate About Switching <Icon name="arrow" />
          </a>
          <a href={PHONE_TEL} className="btn btn-outline-light" onClick={() => trackCallClick('switch_section')}>
            Or call {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <PageHero
          eyebrow="Property management in Adelaide & Mount Gambier"
          title={
            <>
              Your property is an asset. <span className="funnel-accent">We treat it like one.</span>
            </>
          }
          lede="Professional property management for landlords across Adelaide and Mount Gambier — with a team that treats your property as an investment, not just another rental to manage."
          photo={heroPhoto}
          photoAlt="View across the Adelaide hills from one of the properties APN Real Estate manages"
          focalPoint="center 78%"
        >
          <div className="page-hero__actions">
            <a href={FORM_HREF} className="btn btn-primary" onClick={() => pickPropertyType('residential')}>
              Residential Appraisal <Icon name="arrow" />
            </a>
            <a href={FORM_HREF} className="btn btn-outline-light" onClick={() => pickPropertyType('commercial')}>
              Commercial Appraisal <Icon name="arrow" />
            </a>
          </div>
          {/* For a landlord with a problem right now: straight to a person. */}
          <a href={PHONE_TEL} className="funnel-urgent" onClick={() => trackCallClick('urgent_help')}>
            <span className="funnel-urgent__icon">
              <Icon name="phone" />
            </span>
            <span>
              <strong>I need help with a situation now!</strong>
              <span className="funnel-urgent__line">Call {PHONE_DISPLAY}</span>
            </span>
          </a>
          <p className="funnel-hero-switch">
            <a href="#switch" onClick={pickSwitching}>
              Already with another manager? Thinking of switching?
            </a>
          </p>
        </PageHero>
        <Pillars items={PILLARS} label="Why APN Real Estate, in short" />
        <Proof />
        <Problem />
        <WhyApn />
        <Team eyebrow="Meet the team" title="Know who’s looking after your property." linkNames={false} />
        <Offices title="Two offices. A local team in each." />
        <Switching />
        <FormSection
          id="appraisal"
          eyebrow="Free rental appraisal"
          title="What is your property really worth to rent?"
          copy="Tell us about your property. A local APN Real Estate property manager will review the details and contact you directly."
          steps={['We review your property', 'An APN Real Estate property manager contacts you directly', 'You decide, with no obligation to appoint APN Real Estate']}
        >
          <AppraisalForm />
        </FormSection>
        <Faq
          id="faq"
          title="Questions landlords ask us."
          items={FAQS}
          more={
            <>
              Don’t see your question? <a href={FORM_HREF}>Ask us directly</a> — we’d rather give you an accurate
              answer than a generic one.
            </>
          }
        />
        <CtaBand
          title="Ready for property management that feels more straightforward?"
          copy="Tell us about your property and we’ll talk through what APN Real Estate could do for you."
          href={FORM_HREF}
          label="Get My Free Rental Appraisal"
        />
      </main>
      <Footer ctaHref={FORM_HREF} />
      <StickyActions current="/landlords/" cta={{ href: FORM_HREF, label: 'Free Appraisal' }} />
    </>
  );
}
