import Button from '../ui/Button';

function Hero({ apiMessage }) {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <span className="hero__badge">Sri Lanka&apos;s smart wedding platform</span>
        <h1 className="hero__title">
          Plan your perfect day with <em>confidence</em> &amp; charm
        </h1>
        <p className="hero__text">
          WowWed helps couples manage guests, budget, vendors, and seating in one place.
        </p>
        <div className="hero__actions">
          <Button variant="primary" to="/wedding-profile">
            Create wedding profile
          </Button>
          <Button variant="outline" to="/?scroll=features">
            Explore features
          </Button>
          <Button variant="ghost" to="/get-started">
            Get started
          </Button>
        </div>
        {apiMessage && (
          <p className="hero__api" role="status">
            <span className="status-dot status-dot--online" />
            {apiMessage}
          </p>
        )}
      </div>
    </section>
  );
}

export default Hero;
