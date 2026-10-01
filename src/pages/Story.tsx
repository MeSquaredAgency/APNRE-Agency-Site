import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { CtaBand, Gallery, Offices, PageHero, SectionHead, Team } from '../components/sections';
import { BLAIR_ATHOL_PHOTOS } from '../data/offices';
import soldSticker from '../assets/photos/agent-placing-sold-sticker.jpg?photo';

// Facts only: who founded it, the name change, the offices and what the
// business does. Add dates, milestones or awards here only once APN has
// confirmed them.

const SERVICES = [
  {
    title: 'Residential sales',
    copy: 'Appraisals, marketing, inspections and negotiation through to settlement.',
    href: '/selling/',
  },
  {
    title: 'Property management',
    copy: 'Leasing, rent collection, inspections and maintenance for landlords.',
    href: '/leasing/',
  },
  {
    title: 'Leasing',
    copy: 'Finding and screening tenants for rental properties across both regions.',
    href: '/rent/',
  },
];

export default function Story() {
  return (
    <Layout>
      <PageHero
        eyebrow="Our story"
        title="From Adelaide Property Network to APN Real Estate."
        lede="An independent South Australian agency with offices in Blair Athol and Mount Gambier."
        photo={soldSticker}
        photoAlt="A SOLD sticker going up on an Adelaide Property Network auction sign"
        focalPoint="35% center"
      />

      <section className="section section-white">
        <div className="wrap prose-grid">
          <span className="eyebrow">Where we started</span>
          <div className="prose">
            <p className="lede">
              APN Real Estate began in Adelaide as Adelaide Property Network,
              founded by Patrick Nhim.
            </p>
            <p>
              Patrick still leads the sales team today. Property management sits
              alongside that sales work rather than apart from it, so the two
              sides of the business share a day-to-day view of the market.
            </p>
            <p>
              The business now runs from two offices: Blair Athol in Adelaide’s
              north, and Commercial Street East in Mount Gambier. Brett David,
              Regional Manager and Head of Leasing &amp; Accounts, looks after
              leasing and the accounts side of the business.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="wrap">
          <SectionHead eyebrow="What we do" title="Sales and property management, under one roof." />
          <div className="listing-links">
            {SERVICES.map((s) => (
              <a className="listing-link listing-link--card" href={s.href} key={s.title}>
                <h3 className="h-2">{s.title}</h3>
                <p>{s.copy}</p>
                <span className="listing-link__more">
                  Learn more <Icon name="arrow" size={16} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Gallery
        eyebrow="Our Adelaide office"
        title="Come and see us in Blair Athol."
        copy="On the corner of Main North Road and Barton Street, home to our sales team, leasing and accounts, and Adelaide property management."
        photos={[
          BLAIR_ATHOL_PHOTOS.reception,
          BLAIR_ATHOL_PHOTOS.meetingRoom,
          BLAIR_ATHOL_PHOTOS.boardroom,
          BLAIR_ATHOL_PHOTOS.lounge,
          BLAIR_ATHOL_PHOTOS.hallway,
        ]}
      />

      <Team group="leadership" eyebrow="Leadership" title="Who runs APN." />
      <p className="wrap people__careers">
        Want to join us? <a href="/careers/">Work with APN</a>.
      </p>
      <Offices />
      <CtaBand
        title="Work with a local team."
        copy="Whether you’re selling, leasing or buying, start with a conversation."
      />
    </Layout>
  );
}
