import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}

function Logo() {
  return (
    <img
      src="/heartbeat-apple.png"
      alt="Sweety"
      className="brand-logo"
    />
  );
}

function App() {
  const [mode, setMode] = useState('register');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);

    const endpoint =
      mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    const requestBody =
      mode === 'register'
        ? form
        : { email: form.email, password: form.password };

    try {
      const data = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      setUser(data.user);
      setForm({ name: '', email: '', password: '' });
      setSuccess(
        mode === 'register'
          ? 'Your account has been created successfully.'
          : 'You are now signed in.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setMode('login');
      setSuccess('You have been logged out successfully.');
    }
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <Logo />
        <p>Loading Sweety...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#home">
          <Logo />
          <span className="brand-name">sweety<span>.</span></span>
        </a>

        <div className="topbar-right">
          <span className="privacy-note">
            <ShieldCheck size={16} />
            Secure personal health tracking
          </span>

          {user && (
            <button className="text-button" onClick={handleLogout}>
              Log out
            </button>
          )}
        </div>
      </header>

      {user ? (
        <section className="welcome-card">
          <div className="success-icon">
            <Check size={26} />
          </div>

          <p className="eyebrow">ACCOUNT ACTIVE</p>
          <h1>
            Welcome,<br />
            <span>{user.name.split(' ')[0]}.</span>
          </h1>

          <p className="welcome-copy">
            Your Sweety account is ready. You can now continue to your
            personal glucose tracking space.
          </p>

          <div className="account-chip">
            <span className="avatar">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="account-details">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <ShieldCheck className="verified" size={20} />
          </div>
        </section>
      ) : (
        <section className="hero-layout" id="home">
          <div className="hero-copy">
            <div className="eyebrow-pill">
              <span className="status-dot" />
              PERSONAL HEALTH TRACKING
            </div>

            <h1>
              Your health.<br />
              <span>In focus.</span>
            </h1>

            <p className="hero-description">
              Take control of your glucose tracking journey with a simple,
              secure, and organized personal health tracking.
            </p>

            <div className="hero-bottom">
              <span className="hero-line" />
              <span>Designed for clarity in health</span>
            </div>
          </div>

          <section className="auth-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">YOUR PERSONAL SPACE</p>
                <h2>{mode === 'register' ? 'Create account' : 'Welcome back'}</h2>
                <p>
                  {mode === 'register'
                    ? 'Enter your details to get started.'
                    : 'Sign in to access your account.'}
                </p>
              </div>
              <Logo />
            </div>

            <div className="mode-switch">
              <button
                type="button"
                className={mode === 'register' ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setError('');
                  setSuccess('');
                }}
              >
                Sign up
              </button>
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                Log in
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <label className="field">
                  <span>Full name</span>
                  <div className="input-wrap">
                    <UserRound size={18} />
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={updateField}
                      placeholder="Enter your full name"
                      maxLength={100}
                      required
                    />
                  </div>
                </label>
              )}

              <label className="field">
                <span>Email address</span>
                <div className="input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="you@example.com"
                    maxLength={255}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>Password</span>
                <div className="input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    value={form.password}
                    onChange={updateField}
                    placeholder="Enter your password"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === 'register' && (
                  <small className="field-hint">
                    Password must contain 8–72 characters.
                  </small>
                )}
              </label>

              {error && <p className="alert error">{error}</p>}
              {success && <p className="alert success">{success}</p>}

              <button className="submit-button" type="submit" disabled={busy}>
                <span>
                  {busy
                    ? 'Please wait...'
                    : mode === 'register'
                      ? 'Create my account'
                      : 'Log in to Sweety'}
                </span>
                <ArrowRight size={18} />
              </button>
            </form>


          </section>
        </section>
      )}

      <footer className="footer">
        <span>© 2026 Sweety</span>
        <span>Personal health tracking · Built with care</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
