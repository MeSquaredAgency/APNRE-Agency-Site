// Building blocks the pages are assembled from. Each takes its copy as
// props, so the words live with the page that uses them.

import { useState, type ReactNode } from 'react';
import { OFFICE_LIST } from '../data/offices';
import { TEAM, type TeamGroup, type TeamMember } from '../data/team';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import Icon from './Icon';

/* ---------- Page hero: split panel + photo, or panel only ---------- */

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  photo?: string;
  photoAlt?: string;
  focalPoint?: string;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, lede, photo, photoAlt = '', focalPoint, children }: PageHeroProps) {
  return (
    <section className={`page-hero${photo ? ' page-hero--photo' : ''}`}>
      <div className="page-hero__panel">
        <div className="page-hero__content">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="h-display">{title}</h1>
          {lede && <p className="lede">{lede}</p>}
          {children}
        </div>
      </div>
      {photo && (
        <div className="page-hero__media">
          <img src={photo} alt={photoAlt} style={focalPoint ? { objectPosition: focalPoint } : undefined} />
        </div>
      )}
    </section>
  );
}

/* ---------- Scrolling strip of short facts ---------- */

export function Marquee({ items }: { items: string[] }) {
  // The list is rendered twice so the loop is seamless; the copy is
  // hidden from screen readers.
  return (
    <div className="marquee">
      <div className="marquee__track">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined}>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* ---------- Section heading ---------- */

export function SectionHead({ eyebrow, title, action }: { eyebrow: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="h-1">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ---------- Numbered reasons ---------- */

export interface Reason {
  title: string;
  copy: string;
}

export function Reasons({ eyebrow, title, items, dark = false }: { eyebrow: string; title: ReactNode; items: Reason[]; dark?: boolean }) {
  return (
    <section className={`section ${dark ? 'section-dark' : 'section-paper'}`}>
      <div className="wrap">
        <SectionHead eyebrow={eyebrow} title={title} />
        <ol className="reasons">
          {items.map((r, i) => (
            <li key={r.title}>
              <span className="reasons__num">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="h-3">{r.title}</h3>
              <p>{r.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Process steps ---------- */

export function Process({ eyebrow, title, steps }: { eyebrow: string; title: ReactNode; steps: Reason[] }) {
  return (
    <section className="section section-white">
      <div className="wrap">
        <SectionHead eyebrow={eyebrow} title={title} />
        <ol className="process">
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="process__step">Step {i + 1}</span>
              <h3 className="h-3">{s.title}</h3>
              <p>{s.copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

export interface FaqItem {
  q: string;
  a: string;
}

export function Faq({ title, items }: { title: ReactNode; items: FaqItem[] }) {
  return (
    <section className="section section-paper">
      <div className="wrap faq">
        <SectionHead eyebrow="Common questions" title={title} />
        <div className="faq__list">
          {items.map((item) => (
            <details className="faq__item" key={item.q}>
              <summary>
                {item.q}
                <Icon name="plus" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Closing call to action ---------- */

interface CtaBandProps {
  title: ReactNode;
  copy: string;
  href?: string;
  label?: string;
}

export function CtaBand({ title, copy, href = '/appraisal/', label = 'Book a Free Appraisal' }: CtaBandProps) {
  return (
    <section className="cta-band">
      <div className="wrap cta-band__inner">
        <div>
          <h2 className="h-display">{title}</h2>
          <p className="lede">{copy}</p>
        </div>
        <div className="cta-band__actions">
          <a href={href} className="btn btn-primary">
            {label} <Icon name="arrow" />
          </a>
          <a href={PHONE_TEL} className="btn btn-outline-light" onClick={() => trackCallClick('cta_band')}>
            <Icon name="phone" /> {PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Offices ---------- */

export function Offices({ title = 'Two offices, one team.' }: { title?: ReactNode }) {
  return (
    <section className="section section-paper">
      <div className="wrap">
        <SectionHead eyebrow="Our locations" title={title} />
        <div className="offices">
          {OFFICE_LIST.map((office) => (
            <article className="office-card" key={office.id} id={office.id}>
              <img src={office.photo} alt={office.photoAlt} className="office-card__photo" loading="lazy" />
              <div className="office-card__body">
                <h3 className="h-2">{office.name}</h3>
                <p className="office-card__address">
                  {office.addressLines[0]}
                  <br />
                  {office.addressLines[1]}
                </p>
                <p>{office.about}</p>
                <div className="office-card__links">
                  <a href={PHONE_TEL} onClick={() => trackCallClick(`office_${office.id}`)}>
                    <Icon name="phone" /> {office.phone}
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="pin" /> Get directions
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Team ---------- */

const GROUP_LABELS: Record<TeamGroup, string> = {
  sales: 'Sales',
  'property-management': 'Property Management',
  leadership: 'Leadership',
};

function TeamCard({ member }: { member: TeamMember }) {
  const office = OFFICE_LIST.find((o) => o.id === member.office);
  return (
    <article className="team-card">
      <div className="team-card__photo">
        <img
          src={member.photo}
          alt={`${member.name}, ${member.role}`}
          loading="lazy"
          style={member.focalPoint ? { objectPosition: member.focalPoint } : undefined}
        />
      </div>
      <h3 className="team-card__name">{member.name}</h3>
      <p className="team-card__role">{member.role}</p>
      {office && <p className="team-card__office">{office.name}</p>}
      {member.bio && (
        <details className="team-card__bio">
          <summary>About {member.name.split(' ')[0]}</summary>
          <p>{member.bio}</p>
        </details>
      )}
    </article>
  );
}

interface TeamProps {
  /** Show only one group, with no filter. */
  group?: TeamGroup;
  /** Show the All / Sales / Property Management / Leadership filter. */
  filterable?: boolean;
  eyebrow?: string;
  title?: ReactNode;
  headless?: boolean;
}

export function Team({ group, filterable = false, eyebrow = 'Our people', title, headless = false }: TeamProps) {
  const [filter, setFilter] = useState<TeamGroup | 'all'>('all');
  const active = group ?? filter;
  const members = active === 'all' ? TEAM : TEAM.filter((m) => m.groups.includes(active));

  return (
    <section className="section section-white" id="team">
      <div className="wrap">
        {!headless && <SectionHead eyebrow={eyebrow} title={title ?? 'The people you’ll deal with.'} />}
        {filterable && (
          <div className="chips" role="group" aria-label="Filter team">
            {(['all', 'sales', 'property-management', 'leadership'] as const).map((key) => (
              <button
                type="button"
                key={key}
                className="chip"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {key === 'all' ? 'Everyone' : GROUP_LABELS[key]}
              </button>
            ))}
          </div>
        )}
        <div className="team-grid">
          {members.map((m) => (
            <TeamCard key={m.name} member={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Form section: copy on the left, form on the right ---------- */

interface FormSectionProps {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  copy: ReactNode;
  steps?: string[];
  /** h1 when the form is the whole page (e.g. /appraisal/). */
  titleAs?: 'h1' | 'h2';
  children: ReactNode;
}

export function FormSection({ id, eyebrow, title, copy, steps, titleAs: Title = 'h2', children }: FormSectionProps) {
  return (
    <section className="section section-paper" id={id}>
      <div className="wrap form-section">
        <div className="form-section__copy">
          <span className="eyebrow">{eyebrow}</span>
          <Title className="h-1">{title}</Title>
          <p className="lede">{copy}</p>
          {steps && (
            <ol className="form-section__steps">
              {steps.map((s, i) => (
                <li key={s}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}
          <p className="form-section__call">
            Rather talk? Call{' '}
            <a href={PHONE_TEL} onClick={() => trackCallClick(`form_${id ?? 'section'}`)}>
              {PHONE_DISPLAY}
            </a>
          </p>
        </div>
        <div className="form-section__card">{children}</div>
      </div>
    </section>
  );
}
