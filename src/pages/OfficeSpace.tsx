// /office-space/: the spare offices on Level 1 of APN's Blair Athol
// building, leased for 6 to 12 months, and the podcast room, hired for 2
// hours, a half day or a full day. Rooms, prices and terms are in
// src/data/office-space.ts; requests go to /api/enquiry as
// 'office-lease' or 'podcast-hire'. See docs/office-space.md.
//
// Nothing here is booked instantly. A lease starts with an inspection,
// and the team confirms each podcast room booking (adding it to the
// room's calendar, which then greys that session out here).

import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import FloorPlan from '../components/FloorPlan';
import Icon from '../components/Icon';
import { CtaBand, Faq, FormSection, Gallery, PageHero, Pillars, SectionHead } from '../components/sections';
import { BLAIR_ATHOL_PHOTOS, OFFICES } from '../data/offices';
import {
  ANY_OFFICE,
  CONSUMABLES_PER_WEEK,
  LEASABLE_OFFICES,
  LEASE_TERMS,
  OFFICE_PEOPLE,
  OFFICE_RENT_FROM,
  PODCAST_EQUIPMENT,
  PODCAST_KIT_INCLUDED,
  PODCAST_LENGTHS,
  PODCAST_PRICES,
  PODCAST_ROOM,
  PODCAST_SESSIONS,
  PRINTING,
  roomArea,
  roomSize,
  type Room,
  type SessionId,
} from '../data/office-space';
import {
  adelaideToday,
  bookingMonths,
  earliestLeaseStart,
  formatDate,
  isBookableDate,
  latestLeaseStart,
} from '../lib/bookings';
import { formatDay, LISTINGS, photoSrcSet, thumb, type Listing } from '../lib/listings';

/** The Blair Athol offices APN has listed in PropertyMe (its feed:
 *  docs/listings-feed.md), with their photos. Shown alongside the floor
 *  plan, which still takes each room's status from office-space.ts until
 *  PropertyMe's suite numbers are matched to the plan's. */
const LISTED_OFFICES = LISTINGS.filter((l) => l.apnBuilding === 'blair-athol');

function ListedOffices({ onRequest }: { onRequest: () => void }) {
  if (LISTED_OFFICES.length === 0) return null;
  return (
    <section className="section section-paper" id="listed">
      <div className="wrap">
        <SectionHead eyebrow="Listed now" title="Offices available to lease." />
        <ul className="listed-offices">
          {LISTED_OFFICES.map((office) => (
            <ListedOffice key={office.id} office={office} onRequest={onRequest} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ListedOffice({ office, onRequest }: { office: Listing; onRequest: () => void }) {
  const name = office.street ?? office.headline ?? 'Office';
  const photos = office.photos ?? [];
  const alt = (i: number) => `${name}, photo ${i + 1} of ${photos.length}`;
  const intro = office.description?.split(/\n\s*\n/)[0];
  return (
    <li className="listed-office">
      {photos.length > 0 && (
        <div className="listed-office__photos">
          <img
            className="listed-office__main"
            src={photos[0]}
            srcSet={photoSrcSet(office, 0)}
            sizes="(max-width: 760px) 100vw, 55vw"
            alt={alt(0)}
            loading="lazy"
            decoding="async"
          />
          {photos.length > 1 && (
            <details>
              <summary>Show all {photos.length} photos</summary>
              <ul className="listing-photos__grid">
                {photos.slice(1).map((src, i) => (
                  <li key={src}>
                    <a href={src} target="_blank" rel="noopener">
                      <img src={thumb(office, i + 1)} alt={alt(i + 1)} loading="lazy" decoding="async" />
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      <div className="listed-office__body">
        <h3 className="h-3">{name}</h3>
        <p className="listed-office__price">{office.price}</p>
        <p className="listed-office__meta">
          {office.availableFrom ? `Available from ${formatDay(office.availableFrom)}` : 'Available now'}
          {office.buildingArea ? ` · ${office.buildingArea}` : ''}
        </p>
        {office.headline && office.headline !== name && <p className="listed-office__headline">{office.headline}</p>}
        {intro && <p>{intro}</p>}
        <a href="#book" className="btn btn-primary" onClick={onRequest}>
          Request This Office <Icon name="arrow" />
        </a>
      </div>
    </li>
  );
}

type Mode = 'lease' | 'podcast';

const INCLUDED = [
  { title: 'A private, lockable office', copy: 'Your own room with a suite lock, to work or see clients in.' },
  { title: '24-hour access', copy: 'Come and go when you need to, with your own alarm code.' },
  { title: 'High-speed internet', copy: 'A shared high-speed connection for every office.' },
  { title: 'Kitchen & bathrooms', copy: 'A shared kitchen, bathrooms and a shower on the same floor.' },
  { title: 'Boardroom access', copy: 'Use of both boardrooms for meetings and client presentations.' },
  {
    title: 'Printing at cost',
    copy: `A full-colour printer, charged per page: ${PRINTING.mono} black and white, ${PRINTING.colour} colour.`,
  },
  { title: 'Signage space', copy: 'Space is available for your business’s signage.' },
  { title: 'Easy to get to', copy: 'Street parking, and bus stops on Main North Road about 100 metres away.' },
];

const PODCAST_PRICE = `${PODCAST_PRICES}, including GST`;
/** "Recording kit included." or the kit itself, once it's listed. */
const PODCAST_KIT = PODCAST_EQUIPMENT.length
  ? `In the room: ${PODCAST_EQUIPMENT.join(', ')}.`
  : PODCAST_KIT_INCLUDED
    ? 'Recording kit included.'
    : '';

const FAQS = [
  {
    q: 'How long can I lease an office for?',
    a: 'Leases are periodic, from 6 to 12 months, and longer by negotiation. Choose the term you’d like when you request an office and we’ll confirm it with you.',
  },
  {
    q: 'How much does an office cost?',
    a: `Offices start from $${OFFICE_RENT_FROM} a week including GST, depending on the room. Consumables are $${CONSUMABLES_PER_WEEK} a week, and printing is charged at cost: ${PRINTING.mono} a page for black and white and ${PRINTING.colour} for colour.`,
  },
  {
    q: 'Can I see the office before I commit?',
    a: 'Yes. Requesting an office doesn’t commit you to anything. We’ll call to arrange an inspection and talk you through the lease before anything is signed.',
  },
  {
    q: 'What’s included with an office?',
    a: 'Your own lockable office, high-speed internet, the shared kitchen and bathrooms, boardroom access and 24-hour access with your own alarm code. Signage space is available too.',
  },
  {
    q: 'Is there parking?',
    a: 'Street parking is available, and there are bus stops on Main North Road about 100 metres from the building.',
  },
  {
    q: 'How does booking the podcast room work?',
    a: `Pick a date, Monday to Saturday, and a 2-hour, half-day or full-day session: ${PODCAST_PRICES}, including GST. Send the request and we’ll hold the session while we confirm by phone or email; the booking isn’t final until we do. You don’t need a lease to hire it.`,
  },
];

/* ---------- The booking choices, at the top of each form ---------- */

function LeaseChoices({ room, onRoom }: { room: string; onRoom: (id: string) => void }) {
  // Set after hydration, so the pre-rendered page doesn't carry the
  // build day's date.
  const [today, setToday] = useState('');
  useEffect(() => setToday(adelaideToday()), []);

  const chosen = LEASABLE_OFFICES.find((r) => r.id === room);
  const comesFree = chosen?.availableFrom && today && chosen.availableFrom > today ? chosen.availableFrom : '';
  const later = (r: Room) => (r.availableFrom && today && r.availableFrom > today ? r.availableFrom : '');

  return (
    <>
      {LEASABLE_OFFICES.length === 0 ? (
        // Nothing to choose: the request joins the waitlist.
        <>
          <input type="hidden" name="room" value={ANY_OFFICE} />
          <p className="form__note form__note--boxed">
            All our offices are leased at the moment. Tell us what you need and we’ll call you when one comes free.
          </p>
        </>
      ) : (
        <fieldset className="form__choice form__group">
          <legend>Which office?*</legend>
          <div className="form__checks">
            {LEASABLE_OFFICES.map((r) => (
              <label key={r.id}>
                <input
                  type="radio"
                  name="room"
                  value={r.id}
                  required
                  checked={room === r.id}
                  onChange={() => onRoom(r.id)}
                  data-label="an office"
                />
                <span>
                  {r.name}
                  <small className="form__option-note">
                    {roomSize(r) || 'Size on inspection'}
                    {later(r) && ` · from ${formatDate(later(r), { day: 'numeric', month: 'short' })}`}
                  </small>
                </span>
              </label>
            ))}
            <label>
              <input
                type="radio"
                name="room"
                value={ANY_OFFICE}
                required
                checked={room === ANY_OFFICE}
                onChange={() => onRoom(ANY_OFFICE)}
                data-label="an office"
              />
              <span>
                Not sure yet
                <small className="form__option-note">We’ll help you choose</small>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      <fieldset className="form__choice form__group">
        <legend>How long would you like it?*</legend>
        <div className="form__checks">
          {LEASE_TERMS.map((t) => (
            <label key={t.value}>
              <input type="radio" name="term" value={t.value} required data-label="a lease term" />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form__split">
        <label className="form__field">
          <span>Preferred start date*</span>
          <input
            type="date"
            name="start"
            required
            min={today ? earliestLeaseStart(today, chosen?.availableFrom) : undefined}
            max={today ? latestLeaseStart(today) : undefined}
            data-label="A start date"
          />
          {comesFree && (
            <small className="form__option-note">
              {chosen?.name} is available from {formatDate(comesFree, { day: 'numeric', month: 'long' })}.
            </small>
          )}
        </label>
        <label className="form__field">
          <span>People using the office</span>
          <select name="people" defaultValue="">
            <option value="">Choose one (optional)</option>
            {OFFICE_PEOPLE.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="form__field">
        <span>Business name (optional)</span>
        <input type="text" name="business" autoComplete="organization" />
      </label>
    </>
  );
}

interface Availability {
  /** Read from the room's calendar. When false, every date is open and
   *  the team checks by hand. */
  live: boolean;
  booked: Record<string, SessionId[]>;
}

const NOT_LIVE: Availability = { live: false, booked: {} };

function PodcastChoices() {
  const [today, setToday] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [page, setPage] = useState(0);
  const [date, setDate] = useState('');
  const [session, setSession] = useState<SessionId | ''>('');

  useEffect(() => {
    setToday(adelaideToday());
    let cancelled = false;
    const settle = (a: Availability) => {
      if (!cancelled) setAvailability(a);
    };
    fetch('/api/podcast-availability')
      .then((res) => res.json())
      .then((body) => settle(body?.ok ? { live: Boolean(body.live), booked: body.booked ?? {} } : NOT_LIVE))
      .catch(() => settle(NOT_LIVE));
    return () => {
      cancelled = true;
    };
  }, []);

  const months = useMemo(() => (today ? bookingMonths(today) : []), [today]);
  const taken = (d: string) => availability?.booked[d] ?? [];
  const full = (d: string) => PODCAST_SESSIONS.every((s) => taken(d).includes(s.id));

  function chooseDate(d: string) {
    setDate(d);
    if (session && taken(d).includes(session)) setSession('');
  }


  return (
    <>
      <fieldset className="form__choice form__group">
        <legend>Choose a date*</legend>
        {months.length === 0 || !availability ? (
          <p className="form__note">Loading available dates…</p>
        ) : (
          <div className="cal">
            <div className="cal__nav">
              <button
                type="button"
                className="cal__step cal__step--prev"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                aria-label="Previous month"
              >
                <Icon name="chevron" />
              </button>
              <p className="cal__month" aria-live="polite">
                {months[page].label}
              </p>
              <button
                type="button"
                className="cal__step cal__step--next"
                onClick={() => setPage(page + 1)}
                disabled={page === months.length - 1}
                aria-label="Next month"
              >
                <Icon name="chevron" />
              </button>
            </div>
            <div className="cal__row cal__row--head" aria-hidden="true">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            {/* Every month stays in the form (only one is shown), so a
                date chosen in one month is still sent from another. */}
            {months.map((m, i) => (
              <div className="cal__grid" key={m.key} hidden={i !== page}>
                {m.weeks.map((week) => (
                  <div className="cal__row" key={week.find(Boolean)}>
                    {week.map((d, j) => {
                      if (!d) return <span className="cal__day cal__day--blank" key={j} aria-hidden="true" />;
                      const day = Number(d.slice(8));
                      if (!isBookableDate(d, today)) {
                        return (
                          <span className="cal__day cal__day--closed" key={d} aria-hidden="true">
                            {day}
                          </span>
                        );
                      }
                      const booked = full(d);
                      return (
                        <label className="cal__day" key={d}>
                          <input
                            type="radio"
                            name="hireDate"
                            value={d}
                            required
                            disabled={booked}
                            checked={date === d}
                            onChange={() => chooseDate(d)}
                            aria-label={`${formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}${booked ? ', fully booked' : ''}`}
                            data-label="a date"
                            className="visually-hidden"
                          />
                          {day}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
            <p className="form__note" aria-live="polite">
              {date && <strong>{formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}. </strong>}
              {availability.live
                ? 'Open Monday to Saturday; crossed-out dates are fully booked.'
                : 'Open Monday to Saturday. We’ll confirm the date is free when we get back to you.'}
            </p>
          </div>
        )}
      </fieldset>

      <fieldset className="form__choice form__group">
        <legend>Choose a session*</legend>
        {PODCAST_LENGTHS.map((length) => (
          <div className="session-group" key={length.id}>
            <p className="session-group__head">
              {length.label} <span>${length.rate}</span>
            </p>
            <div className={length.id === 'day' ? 'form__choice-options' : 'form__checks'}>
              {PODCAST_SESSIONS.filter((s) => s.length === length.id).map((s) => {
                const gone = Boolean(date) && taken(date).includes(s.id);
                return (
                  <label key={s.id}>
                    <input
                      type="radio"
                      name="session"
                      value={s.id}
                      required
                      disabled={gone}
                      checked={session === s.id}
                      onChange={() => setSession(s.id)}
                      aria-label={`${length.label}, ${s.label}, ${s.time}, $${length.rate}${gone ? ', booked' : ''}`}
                      data-label="a session"
                    />
                    <span>
                      {s.time}
                      <small className="form__option-note">{gone ? 'Booked' : s.label}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <p className="form__note">Prices include GST.{PODCAST_KIT && ` ${PODCAST_KIT}`}</p>
      </fieldset>

      <label className="form__field">
        <span>Business or show name (optional)</span>
        <input type="text" name="business" autoComplete="organization" />
      </label>
    </>
  );
}

/* ---------- The selected room, under the plan ---------- */

function RoomSummary({ mode, room }: { mode: Mode; room?: Room }) {
  if (mode === 'podcast') {
    return (
      <div className="plan__info" aria-live="polite">
        <div>
          <p className="plan__info-title">{PODCAST_ROOM.name}</p>
          <p>
            {roomSize(PODCAST_ROOM)}, next to reception. {PODCAST_PRICE}.{PODCAST_KIT && ` ${PODCAST_KIT}`}
          </p>
        </div>
        <a href="#book" className="btn btn-primary">
          Choose a Date <Icon name="arrow" />
        </a>
      </div>
    );
  }
  if (!room) {
    return (
      <div className="plan__info" aria-live="polite">
        <p>
          {LEASABLE_OFFICES.length
            ? 'Tap a green office to see its details, or the striped room to hire the podcast room.'
            : 'All our offices are leased at the moment. Join the waitlist below, or hire the podcast room.'}
        </p>
      </div>
    );
  }
  const size = roomSize(room);
  const rent = room.weeklyRent ? `$${room.weeklyRent} a week incl. GST` : `From $${OFFICE_RENT_FROM} a week incl. GST`;
  return (
    <div className="plan__info" aria-live="polite">
      <div>
        <p className="plan__info-title">{room.name}</p>
        <p>
          {size ? `${size}, ${roomArea(room)}` : 'Size confirmed on inspection'} ·{' '}
          {room.availableFrom ? `Available from ${formatDate(room.availableFrom)}` : 'Available now'} · {rent}
        </p>
      </div>
      <a href="#book" className="btn btn-primary">
        Request {room.name} <Icon name="arrow" />
      </a>
    </div>
  );
}

export default function OfficeSpace() {
  const [mode, setMode] = useState<Mode>('lease');
  const [room, setRoom] = useState('');

  // #podcast (e.g. from an ad or the hero button) opens the podcast room
  // booking; ?office=office-5 preselects an office. Read after hydration.
  useEffect(() => {
    const fromUrl = () => {
      if (window.location.hash === '#podcast') setMode('podcast');
    };
    fromUrl();
    const office = new URLSearchParams(window.location.search).get('office');
    if (office && LEASABLE_OFFICES.some((r) => r.id === office)) setRoom(office);
    window.addEventListener('hashchange', fromUrl);
    return () => window.removeEventListener('hashchange', fromUrl);
  }, []);

  function select(r: Room) {
    if (r.use === 'podcast') {
      setMode('podcast');
    } else {
      setMode('lease');
      setRoom(r.id);
    }
  }

  const selectedRoom = LEASABLE_OFFICES.find((r) => r.id === room);
  const lease = mode === 'lease';
  const free = LEASABLE_OFFICES.length;
  // With every office leased, the office buttons go to the waitlist.
  const officeCta = free ? { href: '#floor-plan', label: 'Choose an Office' } : { href: '#book', label: 'Join the Waitlist' };

  return (
    <Layout>
      <PageHero
        eyebrow="Office space for lease · Blair Athol"
        title="Private offices on Main North Road."
        lede={`Lockable offices from $${OFFICE_RENT_FROM} a week including GST, on 6 to 12 month terms. Plus a podcast room you can hire from 2 hours to a full day.`}
        // The photos that stay calm behind the words: no signage or
        // shelves where the heading sits.
        slides={[BLAIR_ATHOL_PHOTOS.hallway, BLAIR_ATHOL_PHOTOS.boardroom, BLAIR_ATHOL_PHOTOS.lounge]}
        quiet
      >
        <div className="page-hero__actions">
          <a href={officeCta.href} className="btn btn-primary" onClick={() => setMode('lease')}>
            {officeCta.label} <Icon name="arrow" />
          </a>
          <a href="#podcast" className="btn btn-outline-light" onClick={() => setMode('podcast')}>
            Hire the Podcast Room
          </a>
        </div>
      </PageHero>

      <Pillars
        label="Office space at a glance"
        items={[
          { title: `From $${OFFICE_RENT_FROM} a week`, copy: 'Including GST. The price depends on the office.' },
          { title: '6 to 12 month terms', copy: 'Periodic leases, with longer terms by negotiation.' },
          { title: '24-hour access', copy: 'Your own suite lock and alarm code.' },
          free
            ? { title: `${free} ${free === 1 ? 'office' : 'offices'} available`, copy: `Plus a podcast room, from $${PODCAST_LENGTHS[0].rate} for 2 hours.` }
            : { title: 'Fully leased', copy: `Join the waitlist, or hire the podcast room from $${PODCAST_LENGTHS[0].rate} for 2 hours.` },
        ]}
      />

      <section className="section section-white" id="floor-plan">
        <div className="wrap">
          <SectionHead
            eyebrow="Floor plan"
            title="Pick a room on the plan."
            action={
              <a href="/office-space/floor-plan.jpg" className="btn btn-outline-dark btn-sm" target="_blank" rel="noopener">
                Original floor plan <Icon name="external" />
              </a>
            }
          />
          <p className="lede plan__intro">
            Choose an available office to see its details and request it, or the podcast room to book a session.
            Sizes are approximate, so check them at your inspection.
          </p>
          <FloorPlan selected={lease ? room : PODCAST_ROOM.id} onSelect={select} />
          <RoomSummary mode={mode} room={selectedRoom} />
        </div>
      </section>

      <ListedOffices onRequest={() => setMode('lease')} />

      <section className="section section-white">
        <div className="wrap">
          <SectionHead eyebrow="What’s included" title="Everything you need to get to work." />
          <ul className="included">
            {INCLUDED.map((item) => (
              <li key={item.title}>
                <h3 className="h-3">{item.title}</h3>
                <p>{item.copy}</p>
              </li>
            ))}
          </ul>
          <p className="included__costs">
            On top of rent: consumables are ${CONSUMABLES_PER_WEEK} a week, and printing is charged per page.
          </p>
        </div>
      </section>

      {/* #podcast lands here and switches the form to the podcast room. */}
      <span id="podcast" className="anchor" />
      <FormSection
        id="book"
        eyebrow={lease ? (free ? 'Request an office' : 'Office waitlist') : 'Podcast room'}
        title={lease ? (free ? 'Request your office.' : 'Be first for the next office.') : 'Book the podcast room.'}
        copy={
          lease ? (
            free ? (
              <>
                Choose an office, how long you’d like it and when you’d like to start. We’ll call to arrange an
                inspection and talk you through the lease. Nothing is signed until you’ve seen the room.
              </>
            ) : (
              <>
                Every office is leased right now. Tell us how long you’d like one and when, and we’ll call you as soon
                as one comes free.
              </>
            )
          ) : (
            <>
              A quiet room next to reception, hired for 2 hours, a half day or a full day, Monday to Saturday:{' '}
              {PODCAST_PRICE}.{PODCAST_KIT && ` ${PODCAST_KIT}`} Send a request and we’ll hold the session while we
              confirm your booking by phone or email.
            </>
          )
        }
        steps={
          lease
            ? [free ? 'Choose an office and a term' : 'Tell us what you need', 'We call to arrange an inspection', 'Sign your lease and move in']
            : ['Pick a date and session', 'We confirm your booking', 'Check in at reception on the day']
        }
      >
        <EnquiryForm
          // Not remounted on a switch, so contact details already typed
          // carry over; only the booking choices above them change.
          kind={lease ? 'office-lease' : 'podcast-hire'}
          submitLabel={lease ? (free ? 'Request This Office' : 'Join the Waitlist') : 'Request This Booking'}
          before={
            <div className="segmented" role="group" aria-label="What would you like to book?">
              <button type="button" aria-pressed={lease} onClick={() => setMode('lease')}>
                An office (6–12 months)
              </button>
              <button type="button" aria-pressed={!lease} onClick={() => setMode('podcast')}>
                The podcast room (daily)
              </button>
            </div>
          }
          choices={lease ? <LeaseChoices room={room} onRoom={setRoom} /> : <PodcastChoices />}
          detailsHeading="Your details"
        />
      </FormSection>

      <Gallery
        eyebrow="Inside the building"
        title="Have a look around."
        copy="The building, reception, boardrooms and shared spaces at 420B Main North Road."
        photos={[
          BLAIR_ATHOL_PHOTOS.reception,
          { photo: OFFICES.adelaide.photo, alt: OFFICES.adelaide.photoAlt },
          BLAIR_ATHOL_PHOTOS.boardroom,
          BLAIR_ATHOL_PHOTOS.meetingRoom,
          BLAIR_ATHOL_PHOTOS.lounge,
        ]}
      />

      <Faq title="Questions about our office space." items={FAQS} />

      <CtaBand
        title="Come and see the space."
        copy={
          free
            ? 'Choose an office on the floor plan and we’ll arrange an inspection, or call us to talk it through.'
            : 'Join the waitlist and we’ll call you when an office comes free, or call us to talk it through.'
        }
        href={officeCta.href}
        label={officeCta.label}
      />
    </Layout>
  );
}
