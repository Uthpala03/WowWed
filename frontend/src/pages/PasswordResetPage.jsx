import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormLayout from '../components/layout/FormLayout';
import Button from '../components/ui/Button';
import { getUser, saveUser } from '../utils/storage';

function PasswordResetPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const user = getUser();
    if (!user || user.email !== email.trim().toLowerCase()) {
      setError('Email not found. Use the email from your account.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    saveUser({ ...user, password });
    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <FormLayout title="Reset password" subtitle="Enter your email and choose a new password (M01).">
      {done ? (
        <p>Password updated! Redirecting to login…</p>
      ) : (
        <form className="form" onSubmit={submit}>
          <label className="form__field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="form__field"><span>New password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <p className="form__error">{error}</p>}
          <Button type="submit" variant="primary" className="form__submit">Update password</Button>
        </form>
      )}
      <p className="form-page__footer"><Link to="/login">Back to login</Link></p>
    </FormLayout>
  );
}

export default PasswordResetPage;
