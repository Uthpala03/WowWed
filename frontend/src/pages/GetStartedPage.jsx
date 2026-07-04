import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FormLayout from '../components/layout/FormLayout';
import Button from '../components/ui/Button';
import { roles } from '../data/siteContent';
import { saveUser } from '../utils/storage';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'couple',
};

function GetStartedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    ...emptyForm,
    role: searchParams.get('role') || 'couple',
  });
  const [error, setError] = useState('');

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

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
      role: form.role,
      createdAt: new Date().toISOString(),
    });

    if (form.role === 'couple') {
      navigate('/wedding-profile');
      return;
    }

    navigate('/dashboard');
  };

  return (
    <FormLayout
      title="Get started with WowWed"
      subtitle="Create your account and begin planning with confidence."
    >
      <form className="form" onSubmit={handleSubmit}>
        <fieldset className="form__group">
          <legend>I am a</legend>
          <div className="role-picker">
            {roles.map((role) => (
              <label key={role.id} className={`role-picker__option${form.role === role.id ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value={role.id}
                  checked={form.role === role.id}
                  onChange={update('role')}
                />
                <span>{role.icon}</span>
                <strong>{role.title}</strong>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="form__field">
          <span>Full name</span>
          <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="Priya Perera" />
        </label>

        <label className="form__field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
        </label>

        <label className="form__field">
          <span>Phone</span>
          <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+94 77 123 4567" />
        </label>

        <label className="form__field">
          <span>Password</span>
          <input type="password" value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
        </label>

        <label className="form__field">
          <span>Confirm password</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            placeholder="Repeat password"
          />
        </label>

        {error && <p className="form__error">{error}</p>}

        <Button type="submit" variant="primary" className="form__submit">
          Create account
        </Button>
      </form>

      <p className="form-page__footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </FormLayout>
  );
}

export default GetStartedPage;
