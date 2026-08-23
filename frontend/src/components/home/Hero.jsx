import Button from '../ui/Button';
import { coupleOnboarding } from '../../models/OnboardingPath';
import { scrollToSection } from '../../utils/scrollToSection';

function Hero() {
  return (
    <section className="landing-hero" id="top">
      <div className="container landing-hero__grid">
        <div className="landing-hero__copy">
          <p className="landing-hero__eyebrow">Free · Built for Sri Lankan weddings</p>
          <h1 className="landing-hero__title">
            Plan Your Dream Wedding, <em>Smarter.</em>
          </h1>
          <p className="landing-hero__text">
            Checklist, guests, seating, budget, and vendors — everything in one calm
            dashboard designed for Poruwa, Christian, Muslim, and Civil ceremonies.
          </p>

          <div className="landing-hero__actions">
            <Button variant="primary" to={coupleOnboarding.freshRoute} className="landing-hero__cta">
              Start planning free
            </Button>
            <button type="button" className="landing-hero__link" onClick={() => scrollToSection('features')}>
              Explore features →
            </button>
          </div>

          <ul className="landing-hero__trust">
            <li>17 planning modules</li>
            <li>All 25 districts</li>
            <li>No credit card</li>
          </ul>
        </div>

        <div className="landing-hero__visual">
          <div className="landing-hero__scene" />
          <div className="landing-card landing-card--tasks">
            <h3>Tasks Due This Week</h3>
            <ul>
              <li><span>Collect Poruwa ceremony items</span><small>Ceremony · Jun 7</small></li>
              <li><span>Groom&apos;s clothing fitting</span><small>Suit and Dress · Jun 7</small></li>
              <li><span>Book hair and makeup artist</span><small>Suit and Dress · Feb 14</small></li>
            </ul>
          </div>
          <div className="landing-card landing-card--guests">
            <span>Total Headcount</span>
            <strong>102</strong>
            <div className="landing-card__avatars">👤👤👤👤</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
