import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/home/Hero';
import FeatureStrip from '../components/home/FeatureStrip';
import Features from '../components/home/Features';
import SmartHighlights from '../components/home/SmartHighlights';
import AboutSection from '../components/home/AboutSection';
import VendorSection from '../components/home/VendorSection';
import { scrollToSection } from '../utils/scrollToSection';

function HomePage() {
  const location = useLocation();

  useEffect(() => {
    const hashId = location.hash.replace('#', '');
    const stateId = location.state?.scrollTo;
    const queryId = new URLSearchParams(location.search).get('scroll');
    const target = hashId || stateId || queryId;
    if (!target) return undefined;

    const timer = window.setTimeout(() => scrollToSection(target), 150);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash, location.state, location.search]);

  return (
    <>
      <Hero />
      <FeatureStrip onNavigate={scrollToSection} />
      <Features />
      <SmartHighlights />
      <AboutSection />
      <VendorSection />
    </>
  );
}

export default HomePage;
