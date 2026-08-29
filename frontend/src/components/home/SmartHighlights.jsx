import AppIcon from '../ui/AppIcon';
import { wowWedModules } from '../../models/AppModule';

function SmartHighlights() {
  const items = wowWedModules.getSmartHighlights();

  return (
    <section className="section section--muted smart-highlights" id="smart-features">
      <div className="container">
        <div className="section__header">
          <span className="section__eyebrow">Decision support</span>
          <h2>Smart tools for Sri Lankan wedding planning</h2>
          <p>
            Budget and seating use machine learning trained on local vendor data.
            Vendor match and your readiness score use clear, transparent rules.
          </p>
        </div>
        <div className="smart-highlights__grid">
          {items.map((mod) => {
            const tone = mod.getToneStyle();
            return (
              <article key={mod.id} className="smart-card" style={{ background: tone.bg, color: tone.text }}>
                <span className="smart-card__icon">
                  <AppIcon name={mod.icon} size={24} />
                </span>
                <h3>{mod.name}</h3>
                <p>{mod.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SmartHighlights;
