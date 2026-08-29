import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { vendorNav } from '../../data/dashboardData';
import { getBookings, getVendorProfile, hydrateUserData, refreshBookings } from '../../utils/storage';
import { formatVendorCategories } from '../../utils/vendorMeta';
import { resolveUploadUrl } from '../../utils/uploadUrl';
import { vendorNeedsDecision } from '../../utils/bookingStatus';
import { useAuth } from '../../context/AuthContext';
import { vendorOnboarding } from '../../models/OnboardingPath';
import { getUserHomePath } from '../../utils/userHome';
import { useInboxNotifications } from '../../hooks/useInboxNotifications';
import AppIcon from '../ui/AppIcon';
import NotificationsPanel from '../dashboard/NotificationsPanel';
import NotificationBell from '../dashboard/NotificationBell';
import Footer from '../layout/Footer';
import DashScrollToTop from '../dashboard/DashScrollToTop';
import '../../styles/dashboard.css';

function VendorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [profile, setProfile] = useState(() => getVendorProfile());
  const [pendingCount, setPendingCount] = useState(() => (getBookings() || []).filter((b) => vendorNeedsDecision(b.status)).length);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifBtnRef = useRef(null);
  const inbox = useInboxNotifications(8000);

  useEffect(() => {
    if (loading || !user || user.role !== 'vendor') return undefined;
    hydrateUserData()
      .then(() => {
        setProfile(getVendorProfile());
        setPendingCount((getBookings() || []).filter((b) => vendorNeedsDecision(b.status)).length);
      })
      .catch(() => {});
    const sync = () => {
      setPendingCount((getBookings() || []).filter((b) => vendorNeedsDecision(b.status)).length);
    };
    const poll = setInterval(() => {
      refreshBookings().then(sync).catch(() => {});
    }, 8000);
    window.addEventListener('wowwed-data-changed', sync);
    return () => {
      clearInterval(poll);
      window.removeEventListener('wowwed-data-changed', sync);
    };
  }, [user, loading]);

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

  const scrollNavTop = (path, end) => {
    const active = end
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);
    if (active) window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="dash">
      <aside className="dash-sidebar dash-sidebar--vendor">
        <div className="dash-sidebar__brand">
          <Link to={getUserHomePath(user)} className="dash-sidebar__logo-link" aria-label="Go to your home">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="WowWed" />
          </Link>
          <div className="dash-notif-wrap">
            <button
              ref={notifBtnRef}
              type="button"
              className={`dash-notif-btn${notifOpen ? ' is-open' : ''}`}
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <NotificationBell active={notifOpen} />
              {inbox.unread > 0 && (
                <span className="dash-notif-btn__badge">{inbox.unread > 9 ? '9+' : inbox.unread}</span>
              )}
            </button>
            <NotificationsPanel
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              anchorRef={notifBtnRef}
              inbox={inbox.items}
              unread={inbox.unread}
              includeLocal={false}
              onMarkRead={inbox.markRead}
              onMarkAllRead={inbox.markAllRead}
            />
          </div>
        </div>
        {profile && (
          <div className="dash-sidebar__couple vendor-side-profile">
            {profile.portfolioImages?.[0] ? (
              <img src={resolveUploadUrl(profile.portfolioImages[0])} alt="" className="vendor-side-profile__photo" />
            ) : (
              <span className="dash-sidebar__avatar">🏪</span>
            )}
            <div>
              <strong>{profile.businessName || profile.name}</strong>
              <small>{formatVendorCategories(profile)}</small>
              <em className="vendor-side-profile__live">Live listing</em>
            </div>
          </div>
        )}
        <nav className="dash-sidebar__nav">
          {vendorNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `dash-sidebar__link${isActive ? ' is-active' : ''}`}
              style={{ '--nav-accent': item.ring }}
              onClick={() => scrollNavTop(item.to, item.end)}
            >
              <span className="dash-sidebar__icon" style={{ background: item.accent, color: item.ring }}>
                <AppIcon name={item.icon} size={18} />
              </span>
              {item.label}
              {item.to === '/vendor/bookings' && pendingCount > 0 && (
                <em className="dash-nav-count">{pendingCount}</em>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="dash-sidebar__bottom">
          <button type="button" className="dash-sidebar__link dash-sidebar__link--sub dash-sidebar__link--btn" onClick={() => { logout(); navigate('/'); }}>Log out</button>
        </div>
      </aside>
      <div className="dash-main">
        <DashScrollToTop />
        <Outlet key={user.id} />
        <Footer
          compact
          links={[
            { to: '/', label: 'Home' },
            { to: '/vendor/profile', label: 'Profile' },
          ]}
        />
      </div>
    </div>
  );
}

export default VendorLayout;
