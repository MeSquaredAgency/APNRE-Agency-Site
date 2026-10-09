// Building blocks the pages are assembled from. Each takes its copy as
// props, so the words live with the page that uses them.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { OFFICE_LIST } from '../data/offices';
import { LEADERSHIP_GROUPS, TEAM, teamMemberId, type TeamGroup, type TeamMember } from '../data/team';
import { OPENING_HOURS, PHONE_DISPLAY, PHONE_TEL, PORTALS, SOCIAL_LINKS } from '../data/business';
import { trackCallClick } from '../lib/analytics';
import { faqPage } from '../structured-data';
import HeroSlides, { type HeroSlide } from './HeroSlides';
import Icon from './Icon';
import JsonLd from './JsonLd';
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
  /** Several photos to crossfade between, instead of `photo`. */
  slides?: HeroSlide[];
  focalPoint?: string;
  /** For a busy photo: a dark panel behind the words, fading out to the
   *  right, so the text stays easy to read. */
  quiet?: boolean;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, lede, photo, photoAlt = '', slides, focalPoint, quiet = false, children }: PageHeroProps) {
  return (
    <section className={`page-hero${photo || slides ? ' page-hero--photo' : ''}${quiet ? ' page-hero--quiet' : ''}`}>
      {slides && <HeroSlides slides={slides} />}
      {photo && !slides && (
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

export function Pillars({ items, label = 'About APN Real Estate' }: { items: Pillar[]; label?: string }) {
  return (
    <section className="pillars" aria-label={label}>
      <ul className="wrap pillars__list">
        {items.map((p) => (
          <li key={p.title}>
            <p className="pillars__title">{p.title}</p>
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
  /** CSS object-position for the photo, when the subject isn't central. */
  focalPoint?: string;
}

export function ImageCards({ items }: { items: ImageCard[] }) {
  return (
    <div className={`image-cards image-cards--${items.length}`}>
      {items.map((c) => (
        <a
          href={c.href}
          className="image-card"
          key={c.title}
          aria-label={c.external ? `${c.title} on realestate.com.au (opens in a new tab)` : c.title}
          {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          <Picture
            photo={c.image}
            alt={c.alt}
            style={c.focalPoint ? { objectPosition: c.focalPoint } : undefined}
            sizes={
              items.length >= 4
                ? '(max-width: 900px) 100vw, (max-width: 1100px) 50vw, 25vw'
                : items.length === 3
                  ? '(max-width: 900px) 100vw, 33vw'
                  : '(max-width: 900px) 100vw, 50vw'
            }
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

/* ---------- Social links ---------- */

/** Facebook, Instagram and YouTube: only the ones with a link in
 *  src/data/business.ts, and nothing at all until there's one. */
export function FollowUs({ className = '' }: { className?: string }) {
  const links = SOCIAL_LINKS.filter((l) => l.href);
  if (links.length === 0) return null;
  return (
    <div className={`follow-us ${className}`}>
      <p className="follow-us__title">Follow us</p>
      <ul className="follow-us__links">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noopener noreferrer" aria-label={`APN Real Estate on ${l.label} (opens in a new tab)`}>
              <Icon name={l.icon} size={20} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Portal links, under the listings ---------- */

/** APN's pages on the main portals (only those with a link), then the
 *  social links. */
export function PortalLinks() {
  const groups = [
    { title: 'Residential', links: PORTALS.residential.filter((l) => l.href) },
    { title: 'Commercial', links: PORTALS.commercial.filter((l) => l.href) },
  ].filter((g) => g.links.length > 0);
  return (
    <div className="portal-links">
      {groups.length > 0 && (
        <div>
          <p className="portal-links__title">You can also see our listings on</p>
          <dl className="portal-links__groups">
            {groups.map((g) => (
              <div key={g.title}>
                <dt>{g.title}</dt>
                {g.links.map((l) => (
                  <dd key={l.label}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label} <Icon name="external" size={14} />
                    </a>
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </div>
      )}
      <FollowUs />
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

/** The questions as shown, plus matching FAQPage structured data. */
export function Faq({ id, title, items, more }: { id?: string; title: ReactNode; items: FaqItem[]; more?: ReactNode }) {
  return (
    <section className="section section-paper" id={id}>
      <JsonLd data={faqPage(items)} />
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
          {more && <p className="faq__more">{more}</p>}
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
              {office.photo ? (
                <Picture
                  photo={office.photo}
                  alt={office.photoAlt}
                  className="office-card__photo"
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
              ) : (
                <div className="office-card__photo office-card__logo">
                  <img
                    src={office.logo}
                    alt={office.logoAlt}
                    width={office.logoSize.w}
                    height={office.logoSize.h}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="office-card__body">
                <h3 className="h-2">{office.name}</h3>
                <p className="office-card__address">
                  {office.addressLines[0]}
                  <br />
                  {office.addressLines[1]}
                </p>
                <p className="office-card__hours">
                  <Icon name="clock" />
                  <span aria-hidden="true">{OPENING_HOURS.display}</span>
                  <span className="visually-hidden">{OPENING_HOURS.spoken}</span>
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

interface TeamCardProps {
  member: TeamMember;
  linked: boolean;
  /** Registration number and a profile link in place of the bio, for
   *  the sales and property management pages. */
  credentials?: boolean;
  /** h4 when the cards sit under group headings. */
  nameAs?: 'h3' | 'h4';
}

/** A bio cut to the same number of lines on every card (BIO_LINES in
 *  index.css), so open bios end level with each other, with "Read more"
 *  to show the rest. The button only appears when the bio is longer than
 *  the cut, which can only be measured once the bio is open. */
function BioText({ paragraphs }: { paragraphs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    const details = el.closest('details');
    details?.addEventListener('toggle', measure);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      details?.removeEventListener('toggle', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <>
      <div ref={ref} className={`team-card__bio-text${expanded ? ' is-expanded' : overflows ? ' is-clamped' : ''}`}>
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {(overflows || expanded) && (
        <button type="button" className="team-card__more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </>
  );
}

function TeamCard({ member, linked, credentials = false, nameAs: Name = 'h3' }: TeamCardProps) {
  const office = OFFICE_LIST.find((o) => o.id === member.office);
  const profile = `/our-people/${teamMemberId(member.name)}/`;
  return (
    <article className="team-card" id={teamMemberId(member.name)}>
      <div className="team-card__photo">
        <Picture
          photo={member.photo}
          alt={member.photoAlt}
          style={member.focalPoint ? { objectPosition: member.focalPoint } : undefined}
          sizes="(max-width: 560px) 50vw, 25vw"
        />
      </div>
      <Name className="team-card__name">
        {linked ? <a href={profile}>{member.name}</a> : member.name}
      </Name>
      <p className="team-card__role">{member.role}</p>
      {office && <p className="team-card__office">{office.name}</p>}
      {credentials && member.registration && <p className="team-card__reg">{member.registration}</p>}
      {credentials && linked ? (
        <a className="team-card__profile" href={profile}>
          View profile <Icon name="arrow" size={16} />
          <span className="visually-hidden"> of {member.name}</span>
        </a>
      ) : member.bio && (
        <details className="team-card__bio">
          <summary>About {member.name.split(' ')[0]}</summary>
          <BioText paragraphs={member.bio} />
        </details>
      )}
    </article>
  );
}

interface TeamProps {
  /** Show only one group, with no filter. */
  group?: TeamGroup;
  /** Show exactly these people, in this order, instead of a group. */
  names?: string[];
  /** Each card shows the person's registration number and a link to
   *  their profile (see TeamCard). */
  credentials?: boolean;
  /** Show the group filter and name search. The starting filter comes
   *  from ?filter= in the URL, so menu links like "Sales Team" land
   *  pre-filtered. */
  filterable?: boolean;
  /** Show at most this many, with a link to the full team page. */
  limit?: number;
  eyebrow?: string;
  title?: ReactNode;
  headless?: boolean;
  /** Link each name to the person's own page. Off on campaign funnels,
   *  which keep visitors on the page. */
  linkNames?: boolean;
}

/** Columns on wide screens, so a team never leaves one person alone on
 *  a row: 5 across for five, 3 × 2 for six, otherwise up to 4. */
function teamColumns(count: number): number {
  if (count === 5) return 5;
  if (count > 4 && count % 3 === 0) return 3;
  return Math.min(count, 4);
}

const FILTERS = ['all', 'sales', 'property-management', 'leadership'] as const;
type Filter = (typeof FILTERS)[number];

export function Team({
  group,
  names,
  credentials = false,
  filterable = false,
  limit,
  eyebrow = 'Our people',
  title,
  headless = false,
  linkNames = true,
}: TeamProps) {
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
  // Name, role or office, so "Mount Gambier" finds everyone there.
  const matches = (m: TeamMember) =>
    [m.name, m.role, OFFICE_LIST.find((o) => o.id === m.office)?.name ?? ''].some((text) =>
      text.toLowerCase().includes(q),
    );
  const members = names
    ? names.map((n) => TEAM.find((m) => m.name === n)).filter((m): m is TeamMember => Boolean(m))
    : TEAM.filter((m) => (active === 'all' || m.groups.includes(active)) && (!q || matches(m)));
  const shown = limit ? members.slice(0, limit) : members;

  function reset() {
    setQuery('');
    choose('all');
  }

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
        {/* A headless list still needs a heading between the page's h1
            and the h3 names, for screen readers' heading navigation. */}
        {headless && <h2 className="visually-hidden">{title ?? 'Our team'}</h2>}
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
              <span className="visually-hidden">Search by name, role or office</span>
              <input
                type="search"
                placeholder="Name, role or office"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
        )}
        {filterable && (
          <p className="visually-hidden" role="status">
            {members.length === 1 ? 'Showing 1 person' : `Showing ${members.length} people`}
          </p>
        )}
        {shown.length > 0 ? (
          <div className="team-grid" style={{ ['--team-cols' as string]: teamColumns(shown.length) }}>
            {shown.map((m) => (
              <TeamCard key={m.name} member={m} linked={linkNames} credentials={credentials} />
            ))}
          </div>
        ) : (
          <p className="team-empty">
            No one matches {q ? <>“{query.trim()}”</> : 'that filter'}. Try a first name, a role like “property
            manager”, or an office.{' '}
            <button type="button" className="team-empty__reset" onClick={reset}>
              Show everyone
            </button>
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- Leadership, in groups ---------- */

/** "Who runs APN.": one heading per group (LEADERSHIP_GROUPS in
 *  src/data/team.ts). Every group uses the same four-column grid, so a
 *  group of one doesn't stretch its card, and a second director just
 *  takes the next column. */
export function Leadership({ eyebrow = 'Leadership', title }: { eyebrow?: string; title: ReactNode }) {
  return (
    <section className="section section-white" id="team">
      <div className="wrap">
        <SectionHead eyebrow={eyebrow} title={title} />
        {LEADERSHIP_GROUPS.map((g) => {
          const members = g.names
            .map((n) => TEAM.find((m) => m.name === n))
            .filter((m): m is TeamMember => Boolean(m));
          if (members.length === 0) return null;
          return (
            <div className="team-group" key={g.title}>
              <h3 className="team-group__title">{g.title}</h3>
              <div className="team-grid" style={{ ['--team-cols' as string]: 4 }}>
                {members.map((m) => (
                  <TeamCard key={m.name} member={m} linked nameAs="h4" />
                ))}
              </div>
            </div>
          );
        })}
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

/* ---------- Photo gallery: one large photo and up to four smaller ---------- */

export interface GalleryPhoto {
  photo: Photo;
  alt: string;
}

export function Gallery({ eyebrow, title, copy, photos }: { eyebrow: string; title: ReactNode; copy?: ReactNode; photos: GalleryPhoto[] }) {
  const [first, ...rest] = photos;
  return (
    <section className="section section-paper">
      <div className="wrap">
        <SectionHead eyebrow={eyebrow} title={title} />
        {copy && <p className="lede gallery__copy">{copy}</p>}
        <div className={`gallery gallery--${Math.min(rest.length, 4)}`}>
          <div className="gallery__main">
            <Picture photo={first.photo} alt={first.alt} sizes="(max-width: 900px) 100vw, 60vw" />
          </div>
          {rest.slice(0, 4).map((p) => (
            <div className="gallery__item" key={p.alt}>
              <Picture photo={p.photo} alt={p.alt} sizes="(max-width: 900px) 50vw, 20vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
