import { Link, useLocation, useNavigate } from 'react-router-dom';
import { coupleOnboarding, vendorOnboarding } from '../../models/OnboardingPath';
import { scrollToSection } from '../../utils/scrollToSection';
import WowWedLogo from '../ui/WowWedLogo';

function Footer({ compact = false, links }) {
  const year = new Date().getFullYear();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const compactLinks = links || [
    { to: '/', label: 'Home' },
    { to: '/dashboard/settings', label: 'Settings' },
  ];

  const goToSection = (id) => {
    if (isHome) {
      scrollToSection(id);
      return;
    }
    navigate(`/#${id}`);
  };

  if (compact) {
    return (
      <footer className="site-footer site-footer--app">
        <p>© {year} WowWed · Wedding planning for Sri Lankan couples</p>
        <nav aria-label="Footer">
          {compactLinks.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </nav>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Link to="/" aria-label="WowWed home">
            <WowWedLogo height={40} />
          </Link>
          <p>Free wedding planning for Sri Lankan couples — checklist, guests, budget, vendors, and invitations in one place.</p>
        </div>

        <nav className="site-footer__col" aria-label="Explore">
          <strong>Explore</strong>
          <button type="button" onClick={() => goToSection('about')}>About</button>
          <button type="button" onClick={() => goToSection('features')}>Features</button>
          <button type="button" onClick={() => goToSection('vendors')}>Vendors</button>
        </nav>

        <nav className="site-footer__col" aria-label="For couples">
          <strong>For couples</strong>
          <Link to={coupleOnboarding.freshRoute}>Start planning</Link>
          <Link to="/login">Log in</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

        <nav className="site-footer__col" aria-label="For vendors">
          <strong>For vendors</strong>
          <Link to={vendorOnboarding.route}>Join as a vendor</Link>
          <Link to="/login">Vendor login</Link>
          <Link to="/vendor">Vendor dashboard</Link>
        </nav>
      </div>

      <div className="site-footer__bar">
        <div className="container">
          <p>© {year} WowWed</p>
          <p>Made for Poruwa, Church, Hindu, and Nikah celebrations across all 25 districts</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
