import interiorPhoto from '../../../assets/photos/interior-corner-windows.jpg?photo';
import Picture from '../../../components/Picture';

const REASONS = [
  {
    num: '01',
    tag: 'Local knowledge',
    title: 'People on the ground. Local property knowledge.',
    copy: 'APN operates across Adelaide and Mount Gambier, with people on the ground in both markets.',
  },
  {
    num: '02',
    tag: 'Direct access',
    title: 'Know exactly who’s looking after it.',
    copy: 'You’ll know who is responsible for your property and how to reach them directly.',
  },
  {
    num: '03',
    tag: 'Owner-first thinking',
    title: 'You own the property. You make the decisions.',
    copy: 'Our job is to manage the property professionally, keep you informed and give you the information you need to make your own decisions.',
  },
];

export default function WhyApn() {
  return (
    <section id="why-apn" className="section section-dark why">
      <div className="wrap why__grid">
        <div className="why__copy">
          <span className="eyebrow">Why landlords choose APN</span>
          <h2 className="h-1">A property manager you can actually reach.</h2>

          <ul className="why__list">
            {REASONS.map((r) => (
              <li key={r.num}>
                <div className="why__reason-head">
                  <span className="why__reason-num">{r.num}</span>
                  <span className="why__reason-tag">{r.tag}</span>
                </div>
                <h3 className="why__reason-title">{r.title}</h3>
                <p className="body-copy">{r.copy}</p>
              </li>
            ))}
          </ul>

          <p className="why__founder">
            APN Real Estate was founded by Patrick Nhim, who also leads the
            business’s sales side — so property management here sits
            alongside a working view of the local market, not apart from it.
          </p>

          <a href="#appraisal" className="btn btn-primary">
            Get My Free Rental Appraisal
          </a>
        </div>

        <div className="why__media">
          <Picture
            photo={interiorPhoto}
            sizes="(max-width: 900px) 100vw, 480px"
            alt="Interior of a property managed by APN, with floor-to-ceiling windows"
          />
          <p className="why__caption">
            Real properties, looked after by a local team.
          </p>
        </div>
      </div>
    </section>
  );
}
