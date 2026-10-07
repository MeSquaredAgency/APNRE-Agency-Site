// One page per team member, at /our-people/<id>/ (teamMemberId in
// src/data/team.ts), each listed in src/data/routes.json. Blog bylines
// and the team cards link here. Only what team.ts holds: no invented
// experience, sales figures or direct contact details.

import Layout from '../components/Layout';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import Picture from '../components/Picture';
import { CtaBand, PageHero } from '../components/sections';
import { OPENING_HOURS, PHONE_DISPLAY, PHONE_TEL } from '../data/business';
import { OFFICES } from '../data/offices';
import { TEAM, teamMemberId } from '../data/team';
import { trackCallClick } from '../lib/analytics';
import { usePath } from '../lib/route';
import { breadcrumbList, OFFICE_SCHEMA_IDS, ORGANIZATION_ID, SITE } from '../structured-data';

export default function Person() {
  const path = usePath();
  const member = TEAM.find((m) => path === `/our-people/${teamMemberId(m.name)}/`);
  if (!member) throw new Error(`No team member for ${path}; check src/data/routes.json against src/data/team.ts`);
  const office = OFFICES[member.office];
  const first = member.name.split(' ')[0];
  const id = teamMemberId(member.name);
  const sells = member.groups.includes('sales');
  const manages = member.groups.includes('property-management');

  return (
    <Layout>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          '@id': `${SITE}/our-people/#${id}`,
          url: `${SITE}${path}`,
          name: member.name,
          jobTitle: member.role,
          worksFor: { '@id': OFFICE_SCHEMA_IDS[member.office] },
          memberOf: { '@id': ORGANIZATION_ID },
          ...(member.bio ? { description: member.bio } : {}),
          ...(member.expertise ? { knowsAbout: member.expertise } : {}),
        }}
      />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Our people', path: '/our-people/' },
          { name: member.name, path },
        ])}
      />
      <PageHero eyebrow={`${office.name} office`} title={member.name} lede={member.role}>
        <nav className="hub-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/our-people/">Our people</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{member.name}</span>
        </nav>
      </PageHero>

      <section className="section section-white">
        <div className="wrap person">
          <div className="person__photo">
            <Picture
              photo={member.photo}
              alt={member.photoAlt}
              style={member.focalPoint ? { objectPosition: member.focalPoint } : undefined}
              sizes="(max-width: 760px) 100vw, 40vw"
              priority
            />
          </div>
          <div className="person__body">
            {member.bio && (
              <>
                <h2 className="h-2">About {first}</h2>
                <p className="lede">{member.bio}</p>
              </>
            )}
            {member.expertise && (
              <>
                <h2 className="h-3 person__contact-title">Expertise</h2>
                <ul className="person__expertise">
                  {member.expertise.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            )}
            {member.registration && <p className="person__reg">{member.registration}</p>}
            <h2 className="h-3 person__contact-title">Talk to {first}</h2>
            <p>
              Call the {office.name} office on{' '}
              <a href={PHONE_TEL} onClick={() => trackCallClick(`person_${id}`)}>
                {PHONE_DISPLAY}
              </a>{' '}
              and ask for {first}. {OPENING_HOURS.display}.
            </p>
            <p className="person__address">
              {office.addressLines[0]} {office.addressLines[1]}
            </p>
            <div className="page-hero__actions">
              <a href={PHONE_TEL} className="btn btn-dark" onClick={() => trackCallClick(`person_${id}_button`)}>
                <Icon name="phone" /> Call {PHONE_DISPLAY}
              </a>
              <a href="/our-people/" className="btn btn-outline-dark">
                Meet the Whole Team
              </a>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        title={sells && !manages ? 'Thinking of selling?' : 'What’s your property worth?'}
        copy={
          sells && !manages
            ? 'Book a free sales appraisal with the APN Real Estate sales team. There’s no obligation.'
            : manages && !sells
              ? 'Book a free rental appraisal with an APN Real Estate property manager. There’s no obligation.'
              : 'Book a free sales or rental appraisal with a local APN Real Estate agent. There’s no obligation.'
        }
        href={sells && !manages ? '/appraisal/sales/' : manages && !sells ? '/appraisal/rental/' : '/appraisal/'}
      />
    </Layout>
  );
}
