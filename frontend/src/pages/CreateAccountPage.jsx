import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { useAuth } from '../context/AuthContext';
import { getOnboarding, registerUser } from '../utils/storage';
import { coupleOnboarding, vendorOnboarding } from '../models/OnboardingPath';

function CreateAccountPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const onboarding = getOnboarding();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!onboarding) {
      navigate(coupleOnboarding.route);
      return;
    }

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: onboarding.role || 'couple',
        password: form.password,
      }, onboarding);
      refresh();
      navigate(onboarding.role === 'vendor' ? '/vendor/profile' : '/wedding-profile', {
        state: onboarding.role === 'vendor' ? undefined : { fromSignup: true },
      });
    } catch (err) {
      setError(err.message || 'Could not create account. Is the server running?');
    } finally {
      setSubmitting(false);
    }
  };

  const backRoute = onboarding?.role === 'vendor'
    ? vendorOnboarding.route
    : coupleOnboarding.route;

  return (
    <OnboardingLayout
      step={3}
      totalSteps={3}
      variant={onboarding?.role === 'vendor' ? 'vendor' : 'couple'}
      backTo={backRoute}
      backLabel="← Back"
    >
      <h1 className="onboarding__title">Create your account</h1>
      <p className="onboarding__subtitle">
        {onboarding?.role === 'vendor'
          ? 'One last step before your vendor dashboard.'
          : 'Next you’ll create your wedding profile.'}
      </p>

      <form className="onboarding__form" onSubmit={handleSubmit}>
        <label className="onboarding__field">
          <span>Full name</span>
          <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="Priya Perera" />
        </label>
        <label className="onboarding__field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
        </label>
        <label className="onboarding__field">
          <span>Phone</span>
          <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+94 77 123 4567" />
        </label>
        <label className="onboarding__field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
        </label>
        <label className="onboarding__field">
          <span>Confirm password</span>
          <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Repeat password" />
        </label>

        {error && <p className="onboarding__error">{error}</p>}

        <div className="onboarding__actions">
          <Link to={backRoute} className="onboarding__btn onboarding__btn--outline">Back</Link>
          <button type="submit" className="onboarding__btn onboarding__btn--primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>

      <p className="onboarding__footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </OnboardingLayout>
  );
}

export default CreateAccountPage;
