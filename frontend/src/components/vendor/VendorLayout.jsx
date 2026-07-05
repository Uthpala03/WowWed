import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { vendorNav } from '../../data/dashboardData';
import { getVendorProfile } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { vendorOnboarding } from '../../models/OnboardingPath';
import AppIcon from '../ui/AppIcon';
import '../../styles/dashboard.css';

function VendorLayout() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const profile = getVendorProfile();

  if (loading) {
    return (
      <div className="dash-auth">
        <div className="dash-auth__card"><p>Loading vendor dashboard…</p></div>
      </div>
    );
  }

  if (!user || user.role !== 'vendor') {
    return (
      <div className="dash-auth">
        <div className="dash-auth__card">
          <h1>Vendor access only</h1>
          <p>Register or log in as a vendor to access this area.</p>
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => navigate(vendorOnboarding.route)}>Become a vendor</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <aside className="dash-sidebar dash-sidebar--vendor">
        <div className="dash-sidebar__brand">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" />
          <span className="dash-sidebar__badge">Vendor</span>
        </div>
        {profile && (
          <div className="dash-sidebar__couple">
            <span className="dash-sidebar__avatar">🏪</span>
            <div><strong>{profile.businessName}</strong><small>{profile.category}</small></div>
          </div>
        )}
        <nav className="dash-sidebar__nav">
          {vendorNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `dash-sidebar__link${isActive ? ' is-active' : ''}`} style={{ '--nav-accent': item.ring }}>
              <span className="dash-sidebar__icon" style={{ background: item.accent, color: item.ring }}>
                <AppIcon name={item.icon} size={18} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dash-sidebar__bottom">
          <button type="button" className="dash-sidebar__link dash-sidebar__link--sub dash-sidebar__link--btn" onClick={() => { logout(); navigate('/'); }}>Log out</button>
        </div>
      </aside>
      <div className="dash-main"><Outlet key={user.id} /></div>
    </div>
  );
}

export default VendorLayout;
