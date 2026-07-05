import { wowWedModules } from '../../models/AppModule';
import AppIcon from '../ui/AppIcon';

function FeatureStrip({ onNavigate }) {
  const items = wowWedModules.getStripItems();

  return (
    <div className="feature-strip">
      <div className="container feature-strip__inner">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className="feature-strip__item"
            onClick={() => onNavigate('features')}
          >
            <span className="feature-strip__icon" style={{ color: item.ring }}>
              <AppIcon name={item.icon} size={18} />
            </span>
            <span>{item.stripLabel}</span>
            {i < items.length - 1 && <span className="feature-strip__divider" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FeatureStrip;
