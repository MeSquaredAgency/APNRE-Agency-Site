import Layout from '../components/Layout';
import Icon from '../components/Icon';
import Picture from '../components/Picture';
import { CtaBand, Gallery, Leadership, Offices, PageHero, SectionHead } from '../components/sections';
import { BLAIR_ATHOL_PHOTOS } from '../data/offices';
import { TEAM } from '../data/team';
import soldSticker from '../assets/photos/agent-placing-sold-sticker.jpg?photo';

// "Where we started" is Patrick's own story, in his words (supplied
// 9 Oct 2026, lightly tidied for punctuation only). The rest of the page
// is facts only: what the business does, the leadership and the offices.
// Add other dates, milestones or awards only once APN Real Estate has
// confirmed them.

const patrick = TEAM.find((m) => m.name === 'Patrick Nhim')!;

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
        quiet
      />

      <section className="section section-white" id="patricks-story">
        <div className="wrap founder-letter">
          <figure className="founder-letter__photo">
            <Picture photo={patrick.photo} alt={patrick.photoAlt} sizes="(max-width: 760px) 60vw, 30vw" />
            <figcaption>
              {patrick.name}, {patrick.role}
            </figcaption>
          </figure>
          <div className="prose">
            <span className="eyebrow">Where we started</span>
            <h2 className="h-1">A journey built on resilience, hard work and gratitude.</h2>
            <p className="lede">
              My story is similar to many born in the early ’80s and echoes the incredible opportunities
              Australia has given us. As comedian Anh Do once put it, we are a generation of “coconuts” — brown
              on the outside, but undeniably Australian on the inside. That is certainly true for me.
            </p>
            <p>
              Our family arrived in Australia in late 1984. After two years fleeing war-ravaged Cambodia and
              another four years in a Thai refugee camp, we were beyond thrilled to land on Australian soil. We
              flew with Qantas — thank goodness, because none of us could swim!
            </p>
            <p>
              Life in Sydney in the early ’80s came thick and fast — a vibrant smash of bombastic music and
              incredible Asian food. We loved the newfound freedom. In our small one-bedroom flat, my parents
              worked tirelessly, day and night, sewing clothes for department stores. Five of us lived in that
              flat, but through sheer hard work, my parents saved enough to open a grocery store. By age seven, I
              was working the cash register. That store was my first classroom — where I learned to sell,
              communicate and speak two languages.
            </p>
            <p>
              In the mid-nineties, my parents traded Sydney for a farm in Adelaide. Moving here was a breath of
              fresh air. Coming from multicultural Sydney, I was the only Asian kid in a school of 600. Adelaide to
              me meant scorching summers, jetty jumping, fishing, and river adventures with great mates.
            </p>
            <p>
              I went on to study at Adelaide University, where I learned how to think critically, back my opinions
              with evidence and make bold decisions. After graduating, I spent a decade in automotive sales with
              Ford and BMW, immersing myself in corporate life. But in my 30s, the birth of my daughter completely
              shifted my perspective, teaching me the true value of work-life balance.
            </p>
            <p>
              I am now a very proud family man of two beautiful daughters, with a life partner who supports all my
              eccentricities and adventures. We have a lot to thank my wife for: endless support for me, the
              multiple businesses and our children.
            </p>
            <p>
              Ready for a new chapter, I moved into real estate under the mentorship of an industry veteran with
              over 40 years of experience. I soaked up everything I could and quickly fell in love with the
              industry.
            </p>
            <p>
              In 2013, Adelaide Property Network was born. Why Adelaide? Because I love everything this city
              represents. Why Property? It’s what we do best. Why Network? Because I strongly believe real estate
              professionals achieve more when we collaborate, educate and grow together.
            </p>
            <p>
              Today, APN Real Estate is a growing team driven by freedom, creativity and trust. As a leader, I
              choose to give my team the flexibility to thrive — defining a workplace culture built on support,
              performance and genuine care.
            </p>
            {/* "APN" on its own is Patrick's wording in his signed letter,
                kept as he wrote it; everywhere else it's "APN Real Estate". */}
            <p>
              As a brand and organisation, I have never wanted my name in fairy lights. APN is fine. After all,
              it’s about Brand <em>YOU</em> — the agent — and your relationship with your clients.{' '}
              <a href="/careers/">Reach out and join us.</a>
            </p>
            <p className="founder-letter__tagline">you @ APN</p>
            <p className="founder-letter__signoff">
              Just one happy &amp; grateful coconut,
              <strong>{patrick.name}</strong>
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

      <Leadership title="Who runs APN Real Estate." />
      <p className="wrap people__careers">
        Want to join us? <a href="/careers/">Work with APN Real Estate</a>.
      </p>
      <Offices />
      <CtaBand
        title="Work with a local team."
        copy="Whether you’re selling, leasing or buying, start with a conversation."
      />
    </Layout>
  );
}
