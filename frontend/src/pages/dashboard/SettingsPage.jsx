import { Link } from 'react-router-dom';
import { getUser, getWeddingProfile } from '../../utils/storage';

function SettingsPage() {
  const user = getUser();
  const profile = getWeddingProfile();

  return (
    <div className="dash-page">
      <header className="dash-page__header">
        <div><h1>Settings</h1><p>Your account and wedding details</p></div>
      </header>
      <div className="dash-card settings-card">
        <h3>Account</h3>
        <p><strong>Name:</strong> {user?.fullName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> {user?.phone || '—'}</p>
        <Link to="/wedding-profile" className="dash-btn dash-btn--outline">Edit wedding profile</Link>
        {profile && (
          <p className="settings-profile">
            {profile.partnerOne} &amp; {profile.partnerTwo}
            {profile.ceremonyType ? ` · ${profile.ceremonyType}` : ''}
            {profile.district ? ` · ${profile.district}` : ''}
            {profile.weddingDate ? ` · ${profile.weddingDate}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
