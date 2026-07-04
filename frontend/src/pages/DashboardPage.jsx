import Button from '../components/ui/Button';
import { clearUser, getUser, getWeddingProfile } from '../utils/storage';

function daysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  const target = new Date(dateString);
  const diff = target.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function DashboardPage() {
  const user = getUser();
  const profile = getWeddingProfile();
  const daysLeft = daysUntil(profile?.weddingDate);

  const handleLogout = () => {
    clearUser();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="dashboard-page container">
        <div className="dashboard-empty">
          <h1>Please log in first</h1>
          <div className="dashboard-empty__actions">
            <Button to="/get-started" variant="primary">Get started</Button>
            <Button to="/login" variant="outline">Log in</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-page container">
        <div className="dashboard-empty">
          <h1>Welcome, {user.fullName}</h1>
          <p>Create your wedding profile to continue.</p>
          <Button to="/wedding-profile" variant="primary">Create wedding profile</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page container">
      <header className="dashboard-page__header">
        <div>
          <h1>{profile.partnerOne} &amp; {profile.partnerTwo}</h1>
          <p>{profile.ceremonyType} · {profile.district} · {profile.venue}</p>
        </div>
        <div className="dashboard-page__header-actions">
          <Button to="/wedding-profile" variant="outline">Edit profile</Button>
          <Button to="/chatbot" variant="ghost">Chatbot</Button>
          <Button type="button" variant="ghost" onClick={handleLogout}>Log out</Button>
        </div>
      </header>

      <div className="dashboard-page__grid">
        <article className="dashboard-tile">
          <span>Countdown</span>
          <strong>{daysLeft ?? '—'}</strong>
        </article>
        <article className="dashboard-tile">
          <span>Guests</span>
          <strong>{profile.guestCount}</strong>
        </article>
        <article className="dashboard-tile">
          <span>Budget</span>
          <strong>LKR {Number(profile.budget).toLocaleString()}</strong>
        </article>
      </div>
    </div>
  );
}

export default DashboardPage;
