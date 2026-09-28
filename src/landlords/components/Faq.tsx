const FAQS = [
  {
    q: 'What does APN’s property management service include?',
    a: 'Finding and screening tenants, collecting rent, routine and entry/exit inspections, coordinating maintenance and repairs, and keeping you informed about your property. Get in touch and your property manager can walk you through what that looks like for your specific property.',
  },
  {
    q: 'What happens when something needs repairing?',
    a: 'Your property manager coordinates qualified tradespeople to get it sorted and keeps you informed about what’s happening and why. If you’d like the specifics of how repairs are handled for your property, ask your property manager directly.',
  },
  {
    q: 'How much does property management cost?',
    a: 'Management fees vary depending on your property and what you need. Get in touch and we’ll give you a straight answer for your specific property.',
  },
  {
    q: 'Can I change property managers if my property is currently tenanted?',
    a: 'Yes — it’s a normal process and doesn’t need to disrupt an existing tenancy. Tell us your situation and we’ll explain how it would work for your property.',
  },
  {
    q: 'Who will manage my property, and can I speak to them directly?',
    a: 'A named property manager from our team. You’ll know who they are and be able to reach them directly.',
  },
  {
    q: 'Can APN manage my property if I live interstate?',
    a: 'Get in touch with the details of your property and where you’re based, and we’ll let you know how we can help.',
  },
  {
    q: 'How quickly can my property be leased?',
    a: 'This depends on the property, the market, and the time of year. Ask us for a rental appraisal and we’ll give you a realistic view for your property.',
  },
];

export default function Faq() {
  return (
    <section id="faq" className="section section-paper faq">
      <div className="wrap">
        <div className="faq__head">
          <span className="eyebrow">Common questions</span>
          <h2 className="h-1">Questions landlords ask us.</h2>
        </div>

        <div className="faq__list">
          {FAQS.map((item) => (
            <details className="faq__item" key={item.q}>
              <summary>{item.q}</summary>
              <p className="body-copy">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="faq__more">
          Don’t see your question? <a href="#appraisal">Ask us directly</a> —
          we’d rather give you an accurate answer than a generic one.
        </p>
      </div>
    </section>
  );
}
