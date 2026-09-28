const PROBLEMS = [
  {
    tag: '01',
    title: 'The workload',
    copy: 'Vacancies, maintenance, inspections, arrears and day-to-day tenant communication all take time — time most landlords don’t have.',
  },
  {
    tag: '02',
    title: 'The silence',
    copy: 'You shouldn’t have to chase your property manager to find out what’s happening with your own property.',
  },
  {
    tag: '03',
    title: 'The uncertainty',
    copy: 'You should understand what’s happening with your property, why it’s happening and what comes next.',
  },
];

export default function LandlordProblem() {
  return (
    <section id="pain" className="section section-paper problem">
      <div className="wrap">
        <div className="problem__head">
          <span className="eyebrow">The landlord experience</span>
          <h2 className="h-1">
            You didn’t buy an investment property to manage it yourself.
          </h2>
        </div>

        <div className="problem__grid">
          {PROBLEMS.map((p) => (
            <div className="problem__card" key={p.tag}>
              <span className="problem__tag">{p.tag}</span>
              <h3 className="h-3">{p.title}</h3>
              <p className="body-copy">{p.copy}</p>
            </div>
          ))}
        </div>

        <p className="problem__bridge">
          That’s what professional property management is supposed to take
          off your plate.
        </p>
      </div>
    </section>
  );
}
