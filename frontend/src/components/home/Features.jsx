import { features } from '../../data/siteContent';

function Features() {
  return (
    <section className="section features" id="features">
      <div className="container">
        <div className="section__header">
          <span className="section__eyebrow">Why WowWed</span>
          <h2>Everything you need, thoughtfully in one place</h2>
          <p>
            No more scattered spreadsheets. WowWed replaces manual methods with a unified,
            intelligent platform designed for real Sri Lankan weddings.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature) => (
            <article key={feature.title} className="feature-card">
              <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
