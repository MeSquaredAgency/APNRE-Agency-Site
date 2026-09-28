import balconyView from '../../assets/photos/balcony-view-hills.jpg?photo';
import Picture from '../../components/Picture';

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero__media">
        <Picture photo={balconyView} alt="View across the Adelaide hills from one of the properties APN manages" priority />
        <div className="hero__scrim" />
      </div>

      <div className="wrap hero__content">
        {/* The page's one <h1> is this small line, since it's the one that
            says what we do and where. The big tagline under it is a <p>
            styled to look the same as before (p.hero__headline in
            index.css). */}
        <h1 className="hero__meta hero__meta--above">
          Property management in Adelaide &amp; Mount Gambier
        </h1>
        <p className="h-display hero__headline">
          Your property
          <br />
          is an asset.
          <br />
          <span className="hero__headline-accent">We treat it like one.</span>
        </p>

        <p className="lede hero__lede">
          Professional property management for landlords across Adelaide and
          Mount Gambier — with a team that treats your property as an
          investment, not just another rental to manage.
        </p>

        <div className="hero__actions">
          <a href="#appraisal" className="btn btn-primary">
            Get My Free Rental Appraisal
          </a>
          <a href="#switch" className="btn btn-outline-light">
            Thinking of Switching?
          </a>
        </div>

        <nav className="hero__meta" aria-label="Our offices">
          <a href="/contact/#adelaide">Adelaide</a>
          <span aria-hidden="true">/</span>
          <a href="/contact/#mount-gambier">Mount Gambier</a>
        </nav>
      </div>
    </section>
  );
}
