import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Hero from '../components/home/Hero';
import FeatureStrip from '../components/home/FeatureStrip';
import Features from '../components/home/Features';

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const scrollTarget = location.state?.scrollTo || new URLSearchParams(location.search).get('scroll');
    if (!scrollTarget) return undefined;

    const timer = window.setTimeout(() => {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [location]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Hero />
      <FeatureStrip onNavigate={scrollTo} />
      <Features />
      <section className="section" id="about">
        <div className="container section__header">
          <span className="section__eyebrow">About WowWed</span>
          <h2>Built for Sri Lankan couples</h2>
          <p>WowWed helps you plan every detail of your wedding day — checklist, guests, seating, budget, and vendors — all in one free dashboard.</p>
        </div>
      </section>
      <section className="section section--muted" id="whats-next">
        <div className="container section__header">
          <span className="section__eyebrow">What&apos;s Next</span>
          <h2>Start in minutes</h2>
          <p>Answer a few quick questions, create your account, and your personalized planning dashboard is ready.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/get-started')}>Start planning</button>
        </div>
      </section>
      <section className="section" id="vendors">
        <div className="container section__header">
          <span className="section__eyebrow">Vendors</span>
          <h2>Become a vendor</h2>
          <p>List your wedding business and reach couples across Sri Lanka.</p>
        </div>
      </section>
    </>
  );
}

export default HomePage;
