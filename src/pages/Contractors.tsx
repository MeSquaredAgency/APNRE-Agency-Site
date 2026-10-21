// Preferred contractors, at /client-hub/contractors/: the tradespeople
// APN Real Estate's property managers use, with a Trade drop-down and an
// Area drop-down. Built only once src/data/contractors.json is published
// (docs/preferred-contractors.md).

import { useState } from 'react';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import JsonLd from '../components/JsonLd';
import { CtaBand, PageHero, SectionHead } from '../components/sections';
import { OFFICES, OFFICE_LIST, type OfficeId } from '../data/offices';
import { STOCK } from '../data/media';
import { CONTRACTORS, TRADES, type Contractor } from '../lib/contractors';
import { breadcrumbList } from '../structured-data';

const areaNames = (areas: OfficeId[]) => areas.map((id) => OFFICES[id].name).join(' and ');

function ContractorCard({ c }: { c: Contractor }) {
  return (
    <li className="contractor">
      <p className="contractor__trade">{c.trade}</p>
      <h3 className="h-3 contractor__name">{c.name}</h3>
      <p className="contractor__areas">
        <Icon name="pin" size={16} /> {areaNames(c.areas)}
      </p>
      {c.note && <p className="contractor__note">{c.note}</p>}
      <div className="contractor__links">
        {c.phone && (
          <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>
            <Icon name="phone" size={16} /> {c.phone}
          </a>
        )}
        {c.email && (
          <a href={`mailto:${c.email}`}>
            <Icon name="mail" size={16} /> Email
          </a>
        )}
        {c.website && (
          <a href={c.website} target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={16} /> Website
          </a>
        )}
      </div>
    </li>
  );
}

export default function Contractors() {
  const [trade, setTrade] = useState('');
  const [area, setArea] = useState<OfficeId | ''>('');
  const shown = CONTRACTORS.filter((c) => (!trade || c.trade === trade) && (!area || c.areas.includes(area)));

  return (
    <Layout>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Client hub', path: '/client-hub/' },
          { name: 'Preferred contractors', path: '/client-hub/contractors/' },
        ])}
      />
      <PageHero
        eyebrow="Preferred contractors"
        title="Trusted local trades."
        lede="The tradespeople our property managers use across Adelaide and Mount Gambier."
        photo={STOCK.openPlan.photo}
        photoAlt={STOCK.openPlan.alt}
      >
        <nav className="hub-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/client-hub/">Client hub</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Preferred contractors</span>
        </nav>
      </PageHero>

      <section className="section section-paper">
        <div className="wrap">
          <div className="notice">
            <h2 className="h-3">Renting from us?</h2>
            <p>
              Please report repairs to your property manager rather than booking a contractor yourself, so the work is
              approved and paid for properly. <a href="/client-hub/tenants/#repairs">How to report a repair</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-white">
        <div className="wrap">
          <SectionHead eyebrow="Find a tradesperson" title="Our preferred contractors." />
          {CONTRACTORS.length === 0 ? (
            <p>Our list of preferred contractors is coming soon. In the meantime, ask your property manager.</p>
          ) : (
            <>
              <div className="contractor-filters">
                <label className="form__field">
                  <span>Trade</span>
                  <select value={trade} onChange={(e) => setTrade(e.target.value)}>
                    <option value="">All trades</option>
                    {TRADES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span>Area</span>
                  <select value={area} onChange={(e) => setArea(e.target.value as OfficeId | '')}>
                    <option value="">Adelaide and Mount Gambier</option>
                    {OFFICE_LIST.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="visually-hidden" role="status">
                {shown.length === 1 ? 'Showing 1 contractor' : `Showing ${shown.length} contractors`}
              </p>
              {shown.length > 0 ? (
                <ul className="contractors">
                  {shown.map((c) => (
                    <ContractorCard key={`${c.name}-${c.trade}`} c={c} />
                  ))}
                </ul>
              ) : (
                <p>No preferred contractor for that yet. Ask your property manager, who can recommend someone.</p>
              )}
            </>
          )}
        </div>
      </section>

      <CtaBand
        title="Need something fixed at a property we manage?"
        copy="Your property manager arranges repairs and keeps you informed along the way."
        href="/client-hub/landlords/"
        label="Landlord Hub"
      />
    </Layout>
  );
}
