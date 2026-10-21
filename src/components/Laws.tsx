// Links to the Acts and SA Government guidance that apply, on the client
// hubs and the guides (src/pages/Hubs.tsx, src/pages/Switching.tsx).

import Icon from './Icon';
import { SectionHead } from './sections';

export interface LawLink {
  title: string;
  /** Who publishes it, e.g. "SA legislation". */
  source: string;
  copy: string;
  href: string;
}

const ACT = (name: string) => `https://www.legislation.sa.gov.au/lz?path=${encodeURIComponent(`/c/a/${name.toLowerCase()}`)}`;

/** Official sources only (legislation.sa.gov.au, CBS, SACAT, sa.gov.au):
 *  APN points people to the rules, it doesn't interpret them. */
export const LAWS = {
  residentialTenancies: { title: 'Residential Tenancies Act 1995', source: 'SA legislation', copy: 'The law for residential leases in South Australia, as currently in force.', href: ACT('Residential Tenancies Act 1995') },
  rentingAdvice: { title: 'Renting and letting advice', source: 'Consumer and Business Services', copy: 'The SA Government’s guide to rights and obligations for landlords and tenants.', href: 'https://www.cbs.sa.gov.au/renting-and-letting-advice' },
  rentalReforms: { title: 'Rental reforms', source: 'Consumer and Business Services', copy: 'What has changed in South Australia’s renting laws.', href: 'https://www.cbs.sa.gov.au/campaigns/rental-reforms' },
  bonds: { title: 'Rental bonds', source: 'Consumer and Business Services', copy: 'How bonds are lodged, held and refunded, and how to check a bond’s status.', href: 'https://www.cbs.sa.gov.au/renting-and-letting-advice/bonds' },
  sacat: { title: 'Housing and rental disputes', source: 'SACAT', copy: 'The South Australian Civil and Administrative Tribunal, which hears tenancy disputes.', href: 'https://sacat.sa.gov.au/housing-and-rentals' },
  commercialLeases: { title: 'Retail and Commercial Leases Act 1995', source: 'SA legislation', copy: 'For shops and other retail leases.', href: ACT('Retail and Commercial Leases Act 1995') },
  landAgents: { title: 'Land Agents Act 1994', source: 'SA legislation', copy: 'How agents, sales representatives and property managers are licensed and regulated.', href: ACT('Land Agents Act 1994') },
  saleAndConveyancing: { title: 'Land and Business (Sale and Conveyancing) Act 1994', source: 'SA legislation', copy: 'The law for selling property in SA, including the vendor’s statement (Form 1) and cooling-off.', href: ACT('Land and Business (Sale and Conveyancing) Act 1994') },
  buyersNotice: { title: 'Buyer’s information notice (Form 3)', source: 'Consumer and Business Services', copy: 'Questions worth asking about a property before you buy. PDF.', href: 'https://www.cbs.sa.gov.au/documents/form-3-buyers-information-notice.pdf' },
  buyingSelling: { title: 'Buying, building and selling', source: 'SA Government', copy: 'sa.gov.au’s guides to buying and selling property in South Australia.', href: 'https://www.sa.gov.au/topics/housing-and-property/buying-building-selling' },
} satisfies Record<string, LawLink>;

export default function Laws({ items }: { items: LawLink[] }) {
  return (
    <section className="section section-white" id="laws">
      <div className="wrap">
        <SectionHead eyebrow="Laws and official guides" title="The rules, from the source." />
        <p className="law-links__intro">
          The Acts and SA Government guidance that apply. They’re general information: for your own situation, talk to
          us or get legal advice.
        </p>
        <ul className="law-links">
          {items.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="law-link">
                <span className="law-link__source">{l.source}</span>
                <span className="law-link__title">
                  {l.title} <Icon name="external" size={15} />
                </span>
                <span className="law-link__copy">{l.copy}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
