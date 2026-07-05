import { wowWedModules } from '../../models/AppModule';
import AppIcon from './AppIcon';

function PageHeader({ moduleId, title, tagline, children, className = '' }) {
  const mod = wowWedModules.get(moduleId);
  const heading = title || mod?.name;
  const sub = tagline || mod?.tagline;

  return (
    <header className={`dash-page__header ${className}`.trim()}>
      <div className="dash-page__intro">
        {mod && (
          <span className="dash-page__icon" style={{ background: mod.accent, color: mod.ring }}>
            <AppIcon name={mod.icon} size={22} />
          </span>
        )}
        <div>
          <h1>{heading}</h1>
          {sub && <p>{sub}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

export default PageHeader;
