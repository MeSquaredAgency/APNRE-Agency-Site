import Layout from '../components/Layout';
import Icon from '../components/Icon';
import VideoHero from '../components/VideoHero';
import Picture from '../components/Picture';
import { CtaBand, ImageCards, Offices, Pillars, SectionHead, Team } from '../components/sections';
import { LISTINGS_LINKS, REVIEWS_URL } from '../data/nav';
import { STOCK } from '../data/media';
import soldSticker from '../assets/photos/agent-placing-sold-sticker.jpg?photo';
import soldSign from '../assets/photos/sold-sign-ridley.jpg?photo';

// Pillars are facts APN can stand behind today. Swap in figures (years
// in business, sales volumes, review scores) only once they're verified
// and there's a plan to keep them current.
const PILLARS = [
  { title: 'Two offices', copy: 'Blair Athol in Adelaide’s north, and Commercial Street East in Mount Gambier.' },
  { title: 'One team', copy: 'Sales and property management working side by side, not in separate silos.' },
  { title: 'A named contact', copy: 'You’ll know who’s looking after you and how to reach them directly.' },
  { title: 'Free appraisals', copy: 'Sales and rental appraisals with no obligation to list or appoint us.' },
];

export default function Home() {
  return (
    <Layout overlay>
      <VideoHero />
      <Pillars items={PILLARS} />

      <section className="section section-white">
        <div className="wrap">
          <SectionHead eyebrow="Explore" title="Find your next move." />
          <ImageCards
            items={[
              {
                href: LISTINGS_LINKS.buy.href,
                external: true,
                image: STOCK.houseExterior.photo,
                alt: STOCK.houseExterior.alt,
                kicker: 'Buy',
                title: 'Properties for sale',
              },
              {
                href: LISTINGS_LINKS.rent.href,
                external: true,
                image: STOCK.livingRoom.photo,
                alt: STOCK.livingRoom.alt,
                kicker: 'Rent',
                title: 'Properties for rent',
              },
              {
                href: '/sold/',
                image: soldSign,
                alt: 'An Adelaide Property Network SOLD sign outside a brick home',
                kicker: 'Sold',
                title: 'Recent sales',
              },
            ]}
          />
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature__media">
          <Picture
            photo={STOCK.keysCouple.photo}
            alt={STOCK.keysCouple.alt}
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
        <div className="split-feature__copy">
          <span className="eyebrow">Selling or leasing?</span>
          <h2 className="h-1">Start with an honest appraisal.</h2>
          <p className="lede">
            Tell us about your property and a local APN agent will give you a
            realistic view of what it could sell or rent for, based on recent
            results nearby. No obligation.
          </p>
          <div className="split-feature__actions">
            <a href="/appraisal/?type=sales" className="btn btn-dark">
              Sales Appraisal <Icon name="arrow" />
            </a>
            <a href="/appraisal/?type=rental" className="btn btn-outline-dark">
              Rental Appraisal
            </a>
          </div>
        </div>
      </section>

      <Team limit={4} eyebrow="Our people" title="Partner with a local agent." />

      <section className="section section-dark story">
        <div className="wrap story__grid">
          <div className="story__copy">
            <span className="eyebrow">Our story</span>
            <h2 className="h-1">Started in Adelaide as Adelaide Property Network.</h2>
            <p className="lede">
              Patrick Nhim founded the business as Adelaide Property Network.
              Today it’s APN Real Estate, with offices in Blair Athol and Mount
              Gambier, and sales and property management under one roof.
            </p>
            <div className="split-feature__actions">
              <a href="/our-story/" className="btn btn-light">
                Read Our Story <Icon name="arrow" />
              </a>
              <a href={REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light">
                Reviews on realestate.com.au <Icon name="external" size={16} />
              </a>
            </div>
          </div>
          <div className="story__media">
            <Picture
              photo={soldSticker}
              alt="A SOLD sticker going up on an Adelaide Property Network auction sign"
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="wrap">
          <SectionHead eyebrow="Client hub" title="Already with APN?" />
          <ImageCards
            items={[
              {
                href: '/client-hub/#landlords',
                image: STOCK.openPlan.photo,
                alt: STOCK.openPlan.alt,
                kicker: 'Landlords',
                title: 'Landlord hub',
              },
              {
                href: '/client-hub/#tenants',
                image: STOCK.keysHand.photo,
                alt: STOCK.keysHand.alt,
                kicker: 'Tenants',
                title: 'Tenant hub',
              },
            ]}
          />
        </div>
      </section>

      <Offices />
      <CtaBand
        title="What’s your property worth?"
        copy="Book a free sales or rental appraisal with a local APN agent. There’s no obligation."
      />
    </Layout>
  );
}
