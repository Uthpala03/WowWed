import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingLayout from '../components/layout/OnboardingLayout';
import { getOnboarding, saveUser } from '../utils/storage';

function CreateAccountPage() {
  const navigate = useNavigate();
  const onboarding = getOnboarding();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!onboarding) {
      navigate('/get-started');
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

    saveUser({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: onboarding.role || 'couple',
      password: form.password,
      createdAt: new Date().toISOString(),
    });

    navigate(onboarding.role === 'vendor' ? '/vendor/profile' : '/wedding-profile');
  };

  return (
    <OnboardingLayout step={2}>
      <h1 className="onboarding__title">Create your account</h1>
      <p className="onboarding__subtitle">
        {onboarding.role === 'vendor'
          ? 'One last step before your vendor dashboard.'
          : 'One last step before your planning dashboard.'}
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
          <Link to="/get-started" className="onboarding__btn onboarding__btn--outline">Back</Link>
          <button type="submit" className="onboarding__btn onboarding__btn--primary">Create account</button>
        </div>
      </form>

      <p className="onboarding__footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </OnboardingLayout>
  );
}

export default CreateAccountPage;
