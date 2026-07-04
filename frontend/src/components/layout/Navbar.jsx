import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navLinks } from '../../data/siteContent';
import Button from '../ui/Button';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  const scrollTo = (id) => {
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/', { state: { scrollTo: id } });
  };

  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link className="navbar__brand" to="/">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" className="navbar__logo" />
        </Link>

        <nav className="navbar__links" aria-label="Main navigation">
          {navLinks.map((link) => (
            <button key={link.id} type="button" className="navbar__link" onClick={() => scrollTo(link.id)}>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="navbar__actions">
          <Button variant="ghost" to="/login">Log in</Button>
          <Button variant="primary" to="/get-started">Get started</Button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
