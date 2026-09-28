import { useState, type FormEvent } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { CtaBand, Marquee, Offices, SectionHead, Team } from '../components/sections';
import { saveAppraisalAddress, type AppraisalType } from '../lib/appraisal-handoff';
import { LISTINGS_LINKS } from '../data/nav';
import heroPhoto from '../assets/photos/interior-corner-windows.jpg';
import soldSticker from '../assets/photos/agent-placing-sold-sticker.jpg';
import soldSign from '../assets/photos/sold-sign-ridley.jpg';
import balconyWide from '../assets/photos/balcony-view-wide.jpg';
import mountGambier from '../assets/photos/mount-gambier-hillside-street.jpg';

type HeroTab = 'sell' | 'lease' | 'buy';

const HERO_TABS: { id: HeroTab; label: string }[] = [
  { id: 'sell', label: 'Sell' },
  { id: 'lease', label: 'Lease' },
  { id: 'buy', label: 'Buy' },
];

function Hero() {
  const [tab, setTab] = useState<HeroTab>('sell');
  const [address, setAddress] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const type: AppraisalType = tab === 'lease' ? 'rental' : 'sales';
    if (address.trim()) saveAppraisalAddress(address.trim());
    window.location.href = `/appraisal/?type=${type}`;
  }

  return (
    <section className="home-hero">
      <div className="home-hero__panel">
        <div className="home-hero__content">
          <span className="eyebrow">Adelaide &amp; Mount Gambier</span>
          <h1 className="h-display">
            Local agents.
            <br />
            Straight answers.
          </h1>
          <p className="lede">
            Selling, leasing or looking for your next place, you’ll deal with
            a named APN agent who knows the area.
          </p>

          <div className="home-hero__tabs" role="tablist" aria-label="What are you looking to do?">
            {HERO_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`hero-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="hero-tabpanel"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div id="hero-tabpanel" role="tabpanel" aria-labelledby={`hero-tab-${tab}`}>
            {tab === 'buy' ? (
              <div className="home-hero__buy">
                <a href="/buy/" className="btn btn-primary">
                  Browse Properties For Sale <Icon name="arrow" />
                </a>
                <a href="/buy/#register" className="home-hero__link">
                  Or join our buyer list
                </a>
              </div>
            ) : (
              <form className="home-hero__search" onSubmit={submit}>
                <label htmlFor="hero-address" className="visually-hidden">
                  Your property address
                </label>
                <Icon name="search" />
                <input
                  id="hero-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="Enter your property address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  {tab === 'sell' ? 'Get a Sales Appraisal' : 'Get a Rental Appraisal'}
                  <Icon name="arrow" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="home-hero__media">
        <img src={heroPhoto} alt="Floor-to-ceiling corner windows looking out over Adelaide's eastern suburbs" />
      </div>
    </section>
  );
}

const SERVICES = [
  {
    href: '/selling/',
    photo: soldSign,
    alt: 'An APN sold sign outside an Adelaide home',
    kicker: 'Sell your property',
    title: 'Selling with APN',
  },
  {
    href: '/leasing/',
    photo: balconyWide,
    alt: 'Balcony view from a property managed by APN',
    kicker: 'Lease your property',
    title: 'Property management',
  },
  {
    href: '/buy/',
    photo: mountGambier,
    alt: 'Homes on a hillside street in Mount Gambier',
    kicker: 'Find a home',
    title: 'Buy or rent',
  },
];

function Services() {
  return (
    <section className="section section-paper">
      <div className="wrap">
        <div className="intro">
          <h2 className="h-1">
            Buying, selling or leasing, talk to people who work this market every day.
          </h2>
          <a href="/our-people/" className="btn btn-outline-dark">
            Meet the Team <Icon name="arrow" />
          </a>
        </div>
        <div className="service-tiles">
          {SERVICES.map((s) => (
            <a href={s.href} className="service-tile" key={s.href}>
              <img src={s.photo} alt={s.alt} loading="lazy" />
              <span className="service-tile__scrim" />
              <span className="service-tile__text">
                <span className="service-tile__kicker">{s.kicker}</span>
                <span className="service-tile__title">
                  {s.title} <Icon name="arrow" size={22} />
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Listings() {
  const cards = [
    { key: 'buy', title: 'For sale', copy: 'Homes, land and investment properties APN currently has on the market.', page: '/buy/' },
    { key: 'rent', title: 'For rent', copy: 'Rental properties available now in Adelaide and Mount Gambier.', page: '/rent/' },
    { key: 'sold', title: 'Sold', copy: 'Recent results, and a feel for what similar homes are selling for.', page: '/sold/' },
  ] as const;

  return (
    <section className="section section-white">
      <div className="wrap">
        <SectionHead eyebrow="Properties" title="Our latest listings." />
        <div className="listing-links">
          {cards.map((c) => (
            <article className="listing-link" key={c.key}>
              <h3 className="h-2">{c.title}</h3>
              <p>{c.copy}</p>
              <div className="listing-link__actions">
                <a href={LISTINGS_LINKS[c.key].href} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                  View on realestate.com.au <Icon name="external" size={16} />
                </a>
                <a href={c.page} className="listing-link__more">
                  More <Icon name="arrow" size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="section section-dark story">
      <div className="wrap story__grid">
        <div className="story__media">
          <img src={soldSticker} alt="A SOLD sticker going up on an Adelaide Property Network auction sign" loading="lazy" />
        </div>
        <div className="story__copy">
          <span className="eyebrow">Our story</span>
          <h2 className="h-1">Started in Adelaide as Adelaide Property Network.</h2>
          <p className="lede">
            Patrick Nhim founded the business as Adelaide Property Network.
            Today it’s APN Real Estate, with offices in Blair Athol and Mount
            Gambier, and sales and property management under one roof.
          </p>
          <a href="/our-story/" className="btn btn-outline-light">
            Read Our Story <Icon name="arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout overlay>
      <Hero />
      <Marquee
        items={[
          'Sales',
          'Leasing',
          'Property management',
          'Adelaide',
          'Mount Gambier',
          'Free, no-obligation appraisals',
          'Formerly Adelaide Property Network',
        ]}
      />
      <Services />
      <Listings />
      <Story />
      <Team title="The people you’ll deal with." />
      <Offices />
      <CtaBand
        title="What’s your property worth?"
        copy="Book a free sales or rental appraisal with a local APN agent. There’s no obligation."
      />
    </Layout>
  );
}
