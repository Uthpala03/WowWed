import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';

function HomePage({ apiMessage }) {
  const location = useLocation();

  useEffect(() => {
    const scrollTarget = location.state?.scrollTo || new URLSearchParams(location.search).get('scroll');
    if (!scrollTarget) return undefined;

    const timer = window.setTimeout(() => {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [location]);

  return (
    <>
      <Hero apiMessage={apiMessage} />
      <Features />
    </>
  );
}

export default HomePage;
