import Layout from '../components/Layout';
import JsonLd from '../components/JsonLd';
import { CtaBand, PageHero, Team } from '../components/sections';
import { STOCK } from '../data/media';
import { TEAM, teamMemberId } from '../data/team';
import { OFFICE_SCHEMA_IDS, ORGANIZATION_ID, SITE } from '../structured-data';

/** Everyone on the page as a Person, with the same @id a blog post uses
 *  for its author (src/blog-server.tsx). */
const PEOPLE_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': TEAM.map((m) => ({
    '@type': 'Person',
    '@id': `${SITE}/our-people/#${teamMemberId(m.name)}`,
    url: `${SITE}/our-people/${teamMemberId(m.name)}/`,
    name: m.name,
    jobTitle: m.role,
    worksFor: { '@id': OFFICE_SCHEMA_IDS[m.office] },
    memberOf: { '@id': ORGANIZATION_ID },
  })),
};

export default function People() {
  return (
    <Layout>
      <JsonLd data={PEOPLE_JSON_LD} />
      <PageHero
        eyebrow="Our people"
        title="Meet the team."
        lede="Sales, leasing and property management across our Adelaide and Mount Gambier offices."
        photo={STOCK.suburbAerial.photo}
        photoAlt={STOCK.suburbAerial.alt}
      />
      <Team filterable headless />
      <p className="wrap people__careers">
        Want to join us? <a href="/careers/">Work with APN Real Estate</a>.
      </p>
      <CtaBand
        title="Want to talk to one of us?"
        copy="Call the office or send an enquiry and we’ll put you in touch with the right person."
        href="/contact/"
        label="Contact Us"
      />
    </Layout>
  );
}
