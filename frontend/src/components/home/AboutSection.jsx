import AppIcon from '../ui/AppIcon';
import Button from '../ui/Button';
import { aboutContent } from '../../models/AboutContent';
import { coupleOnboarding } from '../../models/OnboardingPath';

function AboutSection() {
  const { eyebrow, title, intro, stats, highlights } = aboutContent;

  return (
    <section className="section about-section" id="about">
      <div className="container about-section__grid">
        <div className="about-section__copy">
          <span className="section__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{intro}</p>
          <div className="about-section__stats">
            {stats.map((stat) => (
              <div key={stat.label} className="about-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <Button variant="primary" to={coupleOnboarding.route}>Start planning free</Button>
        </div>

        <div className="about-section__cards">
          {highlights.map((item) => (
            <article key={item.title} className="about-card">
              <span className="about-card__icon">
                <AppIcon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
