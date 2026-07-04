import Button from '../ui/Button';

function Hero() {
  return (
    <section className="landing-hero" id="top">
      <div className="container landing-hero__grid">
        <div className="landing-hero__copy">
          <h1 className="landing-hero__title">
            Everything you need to plan your Sri Lanka wedding, completely <em>free.</em>
          </h1>
          <p className="landing-hero__text">
            A free wedding planning app built for Sri Lankan weddings — from guest lists
            and seating charts to budgets and vendor discovery.
          </p>
          <Button variant="primary" to="/get-started" className="landing-hero__cta">
            Start planning
          </Button>
          <p className="landing-hero__note">No credit card. No ads. No stress.</p>
        </div>

        <div className="landing-hero__visual">
          <div className="landing-hero__scene" />
          <div className="landing-card landing-card--tasks">
            <h3>Tasks Due This Week</h3>
            <ul>
              <li><span>Collect Poruwa ceremony items</span><small>Ceremony · Jun 7</small></li>
              <li><span>Groom&apos;s clothing fitting</span><small>Suite and Dress · Jun 7</small></li>
              <li><span>Book hair and makeup artist</span><small>Suite and Dress · Feb 14</small></li>
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
