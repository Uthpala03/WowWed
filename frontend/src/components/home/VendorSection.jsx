import AppIcon from '../ui/AppIcon';
import Button from '../ui/Button';
import { vendorPitch } from '../../models/AboutContent';
import { vendorCatalog } from '../../models/VendorCategory';

function VendorSection() {
  const { eyebrow, title, intro, perks, ctaLabel, ctaTo } = vendorPitch;
  const categories = vendorCatalog.getAll();

  return (
    <section className="section section--muted vendor-section" id="vendors">
      <div className="container vendor-section__inner">
        <div className="vendor-section__copy">
          <span className="section__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{intro}</p>
          <ul className="vendor-section__perks">
            {perks.map((perk) => (
              <li key={perk.text}>
                <AppIcon name={perk.icon} size={18} />
                {perk.text}
              </li>
            ))}
          </ul>
          <Button variant="outline" to={ctaTo}>{ctaLabel}</Button>
        </div>
        <div className="vendor-section__visual">
          <div className="vendor-section__badge">🏪</div>
          <div className="vendor-section__categories">
            {categories.map((cat) => (
              <span key={cat.id} className="vendor-cat-chip">
                <AppIcon name={cat.icon} size={14} />
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default VendorSection;
