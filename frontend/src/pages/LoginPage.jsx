import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormLayout from '../components/layout/FormLayout';
import Button from '../components/ui/Button';
import { getUser, saveUser } from '../utils/storage';

function LoginPage() {
  const navigate = useNavigate();
  const existingUser = getUser();
  const [form, setForm] = useState({
    email: existingUser?.email || '',
    password: '',
  });
  const [error, setError] = useState('');

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const saved = getUser();
    if (!saved) {
      setError('No account found. Please get started first.');
      return;
    }

    if (form.email.trim().toLowerCase() !== saved.email) {
      setError('Email not found. Check your details or create an account.');
      return;
    }

    if (!form.password) {
      setError('Please enter your password.');
      return;
    }

    saveUser({ ...saved, lastLogin: new Date().toISOString() });
    navigate(saved.role === 'couple' ? '/dashboard' : '/dashboard');
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

        <Button type="submit" variant="primary" className="form__submit">
          Log in
        </Button>
      </form>

      <p className="form-page__footer">
        New to WowWed? <Link to="/get-started">Get started</Link>
      </p>
    </FormLayout>
  );
}

export default LoginPage;
