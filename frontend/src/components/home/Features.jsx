import Button from '../ui/Button';
import AppIcon from '../ui/AppIcon';
import { coupleOnboarding } from '../../models/OnboardingPath';
import { wowWedModules } from '../../models/AppModule';

function FeatureShowcaseCard({ module: mod }) {
  const tone = mod.getToneStyle();

  return (
    <article
      className="feature-showcase"
      style={{ background: tone.bg, color: tone.text }}
    >
      <span className="feature-showcase__icon" aria-hidden="true">
        <AppIcon name={mod.icon} size={26} />
      </span>
      <h3 className="feature-showcase__title">{mod.name}</h3>
      <p className="feature-showcase__text">{mod.description}</p>
    </article>
  );
}

function Features() {
  const cards = wowWedModules.getShowcaseCards();

  return (
    <section className="section features" id="features">
      <div className="container features-toolkit">
        <div className="features-toolkit__grid">
          {cards.map((mod) => (
            <FeatureShowcaseCard key={mod.id} module={mod} />
          ))}
        </div>

        <aside className="features-toolkit__aside">
          <h2>Everything your wedding needs, together</h2>
          <p>
            WowWed brings checklist, guests, seating, budget, and vendors into one calm
            dashboard — built for Sri Lankan Poruwa, Christian, Muslim, and Civil ceremonies.
          </p>
          <Button variant="primary" to={coupleOnboarding.freshRoute}>Start planning</Button>
          <div className="features-toolkit__roses" aria-hidden="true">🌹</div>
        </aside>
      </div>
    </section>
  );
}

export default Features;
