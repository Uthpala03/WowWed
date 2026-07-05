import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { dashboardNav } from '../../data/dashboardData';
import { buildNotifications } from '../../utils/notifications';
import { getWeddingProfile } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { coupleOnboarding } from '../../models/OnboardingPath';
import AppIcon from '../ui/AppIcon';
import NotificationsPanel from './NotificationsPanel';
import '../../styles/dashboard.css';

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const profile = getWeddingProfile();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifCount = buildNotifications().length;

  useEffect(() => {
    if (!loading && user?.role === 'vendor') navigate('/vendor', { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="dash-auth">
        <div className="dash-auth__card"><p>Loading your wedding data…</p></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dash-auth">
        <div className="dash-auth__card">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" className="dash-auth__logo" />
          <h1>Welcome to WowWed</h1>
          <p>Your beautiful wedding planner awaits.</p>
          <button type="button" className="dash-btn dash-btn--primary" onClick={() => navigate('/login')}>Log in</button>
          <button type="button" className="dash-btn dash-btn--outline" onClick={() => navigate(coupleOnboarding.route)}>Start planning</button>
        </div>
      </div>
    );
  }

  if (user.role === 'vendor') return null;

  const initials = profile ? `${profile.partnerOne?.[0] || ''}${profile.partnerTwo?.[0] || ''}` : user.fullName?.slice(0, 2).toUpperCase() || 'WW';

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-sidebar__brand">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" />
          <button type="button" className="dash-notif-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
            🔔{notifCount > 0 && <span>{notifCount}</span>}
          </button>
        </div>
        <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

        {profile && (
          <div className="dash-sidebar__couple">
            <span className="dash-sidebar__avatar">{initials}</span>
            <div><strong>{profile.partnerOne} & {profile.partnerTwo}</strong><small>{profile.ceremonyType}</small></div>
          </div>
        )}

        <nav className="dash-sidebar__nav">
          {dashboardNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `dash-sidebar__link${isActive ? ' is-active' : ''}`} style={{ '--nav-accent': item.ring }}>
              <span className="dash-sidebar__icon" style={{ background: item.accent, color: item.ring }}>
                <AppIcon name={item.icon} size={18} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar__bottom">
          <NavLink to="/dashboard/settings" className={({ isActive }) => `dash-sidebar__link dash-sidebar__link--sub${isActive ? ' is-active' : ''}`}>Settings</NavLink>
          <button type="button" className="dash-sidebar__link dash-sidebar__link--sub dash-sidebar__link--btn" onClick={() => { logout(); navigate('/'); }}>Log out</button>
        </div>
      </aside>
      <div className="dash-main"><Outlet key={user.id} /></div>
    </div>
  );
}

export default DashboardLayout;
