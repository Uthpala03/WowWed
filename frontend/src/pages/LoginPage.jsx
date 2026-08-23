import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormLayout from '../components/layout/FormLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../utils/storage';
import { coupleOnboarding } from '../models/OnboardingPath';

function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await loginUser(form.email.trim().toLowerCase(), form.password);
      refresh();
      navigate(user.role === 'vendor' ? '/vendor' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormLayout title="Welcome back" subtitle="Log in to continue planning your wedding.">
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
        </label>

        <label className="form__field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={update('password')} placeholder="Your password" />
        </label>

        {error && <p className="form__error">{error}</p>}

        <Button type="submit" variant="primary" className="form__submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="form-page__footer">
        <Link to="/password-reset">Forgot password?</Link> · New to WowWed? <Link to={coupleOnboarding.freshRoute}>Get started</Link>
      </p>
    </FormLayout>
  );
}

export default LoginPage;
