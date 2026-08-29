import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { mainNav } from '../../models/NavItem';
import { coupleOnboarding, vendorOnboarding } from '../../models/OnboardingPath';
import { useAuth } from '../../context/AuthContext';
import { scrollToSection } from '../../utils/scrollToSection';
import { getUserHomePath } from '../../utils/userHome';
import AppIcon from '../ui/AppIcon';
import Button from '../ui/Button';
import WowWedLogo from '../ui/WowWedLogo';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const dashTo = getUserHomePath(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const isHome = location.pathname === '/';
  const links = mainNav.getMainLinks();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) setActiveId(hash);
  }, [location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return undefined;

    const sectionIds = links.map((link) => link.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isHome, links]);

  const goToSection = (id) => {
    setMenuOpen(false);
    setActiveId(id);
    if (isHome) {
      scrollToSection(id);
      return;
    }
    navigate(`/#${id}`);
  };

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link className="navbar__brand" to={dashTo} onClick={() => setMenuOpen(false)}>
          <WowWedLogo height={40} />
        </Link>

        <nav className="navbar__links navbar__links--pill" aria-label="Main navigation">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`navbar__link${activeId === link.id ? ' is-active' : ''}`}
              onClick={() => goToSection(link.id)}
            >
              <span className="navbar__link-icon">
                <AppIcon name={link.icon} size={15} />
              </span>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <Link className="navbar__login" to={dashTo}>Dashboard</Link>
              <Button variant="primary" to={dashTo} className="navbar__btn-plan">
                {user.role === 'vendor' ? 'Vendor home' : 'Continue planning'}
              </Button>
            </>
          ) : (
            <>
              <Link className="navbar__login" to="/login">Log in</Link>
              <Button variant="vendor" to={vendorOnboarding.route} className="navbar__btn-vendor">
                Join as a vendor
              </Button>
              <Button variant="primary" to={coupleOnboarding.freshRoute} className="navbar__btn-plan">
                Start planning
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className={`navbar__menu-btn${menuOpen ? ' is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <nav className="navbar__mobile" aria-label="Mobile navigation">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`navbar__mobile-link${activeId === link.id ? ' is-active' : ''}`}
              onClick={() => goToSection(link.id)}
            >
              <span className="navbar__link-icon">
                <AppIcon name={link.icon} size={16} />
              </span>
              {link.label}
            </button>
          ))}
          <div className="navbar__mobile-actions">
            {user ? (
              <Button variant="primary" to={dashTo} onClick={() => setMenuOpen(false)}>
                {user.role === 'vendor' ? 'Vendor home' : 'Continue planning'}
              </Button>
            ) : (
              <>
                <Link className="navbar__login navbar__login--block" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Button variant="vendor" to={vendorOnboarding.route} onClick={() => setMenuOpen(false)}>Join as a vendor</Button>
                <Button variant="primary" to={coupleOnboarding.freshRoute} onClick={() => setMenuOpen(false)}>Start planning</Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
