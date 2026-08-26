import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOnboarding, getWeddingProfile } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profile = getWeddingProfile();
  const onboarding = getOnboarding();

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dash-page">
      <PageHeader title="Settings" tagline="Your account and wedding details" />

      <div className="settings-grid">
        <div className="dash-card settings-card">
          <h3>Account</h3>
          <p><strong>Name:</strong> {user?.fullName || '—'}</p>
          <p><strong>Email:</strong> {user?.email || '—'}</p>
          <p><strong>Phone:</strong> {user?.phone || '—'}</p>
          <p><strong>Role:</strong> {user?.role === 'vendor' ? 'Vendor' : 'Couple'}</p>
          <div className="settings-actions">
            <Link to="/password-reset" className="dash-btn dash-btn--outline">Reset password</Link>
            <button type="button" className="dash-btn dash-btn--ghost" onClick={signOut}>Log out</button>
          </div>
        </div>

        <div className="dash-card settings-card">
          <h3>Wedding</h3>
          {profile?.partnerOne && profile?.partnerTwo ? (
            <p className="settings-profile">
              {profile.partnerOne} &amp; {profile.partnerTwo}
              {profile.ceremonyType ? ` · ${profile.ceremonyType}` : ''}
              {profile.district ? ` · ${profile.district}` : ''}
              {profile.weddingDate ? ` · ${String(profile.weddingDate).slice(0, 10)}` : ''}
            </p>
          ) : (
            <p>Add your names, date, and district so every module can use them.</p>
          )}
          {onboarding?.planningStage && (
            <p><strong>Planning stage:</strong> {onboarding.planningStage}</p>
          )}
          <div className="settings-actions">
            <Link to="/wedding-profile" className="dash-btn dash-btn--primary">Edit wedding profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
