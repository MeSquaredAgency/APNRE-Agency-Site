import { OFFICE_LIST, type OfficeId } from '../data/offices';
import { TEAM } from '../../../data/team';

interface OfficesStripProps {
  /** On an office page, leave that office out and point to the other. */
  exclude?: OfficeId;
}

export default function OfficesStrip({ exclude }: OfficesStripProps) {
  const offices = OFFICE_LIST.filter((o) => o.id !== exclude);

  return (
    <section id="offices" className="section section-paper-dim offices">
      <div className="wrap">
        <div className="offices__head">
          <span className="eyebrow">{exclude ? 'Our other office' : 'Our offices'}</span>
          <h2 className="h-2">
            {exclude ? 'Also in ' + offices.map((o) => o.name).join(' and ') + '.' : 'Two offices. A local team in each.'}
          </h2>
        </div>

        <div className="offices__grid">
          {offices.map((office) => {
            const people = TEAM.filter((m) => m.office === office.id).map((m) => m.name.split(' ')[0]);
            return (
              <a href={office.path} className="offices__card" key={office.id}>
                <h3 className="h-3">{office.name}</h3>
                <p className="offices__address">
                  {office.addressLines[0]} {office.addressLines[1]}
                </p>
                <p className="offices__people">{people.join(', ')}</p>
                <span className="offices__link">View the {office.name} office →</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
