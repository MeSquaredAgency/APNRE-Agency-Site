// Building blocks the pages are assembled from. Each takes its copy as
// props, so the words live with the page that uses them.

import { useEffect, useState, type ReactNode } from 'react';
import { OFFICE_LIST } from '../data/offices';
import { TEAM, type TeamGroup, type TeamMember } from '../data/team';
import { PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import Icon from './Icon';
import Picture from './Picture';
import type { Photo } from '../lib/photo';

/* ---------- Page hero: full-bleed photo under a dark scrim ---------- */

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Leave unset for a plain dark hero. */
  photo?: Photo;
  photoAlt?: string;
  focalPoint?: string;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, lede, photo, photoAlt = '', focalPoint, children }: PageHeroProps) {
  return (
    <section className={`page-hero${photo ? ' page-hero--photo' : ''}`}>
      {photo && (
        // The hero is the page's main image, so it loads straight away.
        <Picture
          photo={photo}
          alt={photoAlt}
          className="page-hero__img"
          style={focalPoint ? { objectPosition: focalPoint } : undefined}
          priority
        />
      )}
      <div className="page-hero__scrim" />
      <div className="wrap page-hero__content">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="h-display">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children}
      </div>
    </section>
  );
}

/* ---------- Row of short, verifiable points under the home hero ---------- */

export interface Pillar {
  title: string;
  copy: string;
}

export function Pillars({ items }: { items: Pillar[] }) {
  return (
    <section className="pillars" aria-label="About APN">
      <ul className="wrap pillars__list">
        {items.map((p) => (
          <li key={p.title}>
            <h2 className="pillars__title">{p.title}</h2>
            <p>{p.copy}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Large image link cards ---------- */

export interface ImageCard {
  href: string;
  image: Photo;
  alt: string;
  kicker: string;
  title: string;
  external?: boolean;
}

export function ImageCards({ items }: { items: ImageCard[] }) {
  return (
    <div className={`image-cards image-cards--${items.length}`}>
      {items.map((c) => (
        <a
          href={c.href}
          className="image-card"
          key={c.title}
          {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Picture
            photo={c.image}
            alt={c.alt}
            sizes={items.length === 3 ? '(max-width: 900px) 100vw, 33vw' : '(max-width: 900px) 100vw, 50vw'}
          />
          <span className="image-card__scrim" />
          <span className="image-card__text">
            <span className="image-card__kicker">{c.kicker}</span>
            <span className="image-card__title">{c.title}</span>
            <span className="image-card__cta">
              {c.external ? 'View on realestate.com.au' : 'Discover more'}{' '}
              <Icon name={c.external ? 'external' : 'arrow'} size={16} />
            </span>
          </span>
        </a>
      ))}
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
              <Picture
                photo={office.photo}
                alt={office.photoAlt}
                className="office-card__photo"
                sizes="(max-width: 900px) 100vw, 50vw"
              />
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
        <Picture
          photo={member.photo}
          alt={member.photoAlt}
          style={member.focalPoint ? { objectPosition: member.focalPoint } : undefined}
          sizes="(max-width: 560px) 50vw, 25vw"
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
  /** Show the group filter and name search. The starting filter comes
   *  from ?filter= in the URL, so menu links like "Sales Team" land
   *  pre-filtered. */
  filterable?: boolean;
  /** Show at most this many, with a link to the full team page. */
  limit?: number;
  eyebrow?: string;
  title?: ReactNode;
  headless?: boolean;
}

const FILTERS = ['all', 'sales', 'property-management', 'leadership'] as const;
type Filter = (typeof FILTERS)[number];

export function Team({ group, filterable = false, limit, eyebrow = 'Our people', title, headless = false }: TeamProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  // Pre-rendered showing everyone; ?filter= (from menu links like "Sales
  // Team") and ?q= (from the home hero's "Find an agent" search) are
  // applied after hydration.
  useEffect(() => {
    if (!filterable) return;
    const params = new URLSearchParams(window.location.search);
    const value = params.get('filter') ?? '';
    if ((FILTERS as readonly string[]).includes(value)) setFilter(value as Filter);
    setQuery(params.get('q') ?? '');
  }, [filterable]);
  const active = group ?? filter;
  const q = query.trim().toLowerCase();
  const members = TEAM.filter(
    (m) =>
      (active === 'all' || m.groups.includes(active)) &&
      (!q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)),
  );
  const shown = limit ? members.slice(0, limit) : members;

  function choose(next: Filter) {
    setFilter(next);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('filter');
    else url.searchParams.set('filter', next);
    window.history.replaceState(null, '', url);
  }

  return (
    <section className="section section-white" id="team">
      <div className="wrap">
        {!headless && (
          <SectionHead
            eyebrow={eyebrow}
            title={title ?? 'The people you’ll deal with.'}
            action={
              limit ? (
                <a href="/our-people/" className="btn btn-outline-dark">
                  Meet the Whole Team <Icon name="arrow" />
                </a>
              ) : undefined
            }
          />
        )}
        {filterable && (
          <div className="team-tools">
            <div className="chips" role="group" aria-label="Filter team">
              {FILTERS.map((key) => (
                <button
                  type="button"
                  key={key}
                  className="chip"
                  aria-pressed={filter === key}
                  onClick={() => choose(key)}
                >
                  {key === 'all' ? 'Everyone' : GROUP_LABELS[key]}
                </button>
              ))}
            </div>
            <label className="team-search">
              <Icon name="search" />
              <span className="visually-hidden">Search by name or role</span>
              <input
                type="search"
                placeholder="Search by name or role"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
        )}
        {shown.length > 0 ? (
          <div className="team-grid">
            {shown.map((m) => (
              <TeamCard key={m.name} member={m} />
            ))}
          </div>
        ) : (
          <p className="team-empty">No one matches that search.</p>
        )}
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
