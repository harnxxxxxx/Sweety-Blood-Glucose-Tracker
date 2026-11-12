
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
  UserRound,
  Activity,
  Pencil,
  Trash2,
  X
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

// Logo component
function Logo() {
  return (
    <img
      src="/heartbeat-apple.png"
      alt="Sweety"
      className="brand-logo"
    />
  );
}

// date in YYYY-MM-DD format
function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Format an ISO date without introducing timezone shifts.
function formatReportDate(dateString) {
  if (!dateString) return '';

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

//  time slots
const timeSlots = [
  { value: 'morning', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' }
];

// Dashboard component
function Dashboard({ user }) {
  const [readings, setReadings] = useState([]);

  const [form, setForm] = useState({
    date: getToday(),
    timeSlot: 'morning',
    value: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reports state
  const [reportDate, setReportDate] = useState(getToday());
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState('');
  const [showReports, setShowReports] = useState(false);

  // Fetch glucose readings
  async function loadReadings() {
    try {
      const data = await api('/api/readings');
      setReadings(data.readings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReadings();
  }, []);

  // Fetch daily, month-to-date, and previous-month reports.
  async function loadReports(date = reportDate) {
    setReportLoading(true);
    setReportError('');

    try {
      const data = await api(`/api/reports?date=${encodeURIComponent(date)}`);
      setReportData(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    loadReports(reportDate);
  }, [reportDate]);

  const selectedReport = reportData?.reports?.[reportType];
  const selectedRange = reportData?.dateRanges?.[reportType];

  // Handle form input changes
  function updateReadingField(event) {
    const { name, value } = event.target;

    setForm(current => ({
      ...current,
      [name]: value
    }));
  }

  // Add or update a glucose reading
  async function handleSave(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    // Validate here warning pop ups
    if (!form.date) {
      setError('Please select a date.');
      return;
    }

    if (form.date > getToday()) {
      setError('Date cannot be in the future.');
      return;
    }

    if (form.value.trim() === '') {
      setError('Please enter a glucose value.');
      return;
    }

    const glucoseValue = Number(form.value);

    if (!Number.isInteger(glucoseValue) || glucoseValue < 40 || glucoseValue > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    setBusy(true);

    try {
      const endpoint = editingId
        ? `/api/readings/${editingId}`
        : '/api/readings';

      const data = await api(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form)
      });

      setSuccess(data.message);

      setForm({
        date: getToday(),
        timeSlot: 'morning',
        value: ''
      });

      setEditingId(null);

      await loadReadings();
      await loadReports();

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Load a reading into the form for editing
  function handleEdit(reading) {
    setEditingId(reading.id);

    setForm({
      date: String(reading.reading_date).slice(0, 10),
      timeSlot: reading.time_slot,
      value: String(reading.glucose_value)
    });

    setError('');
    setSuccess('');
  }

  // Delete a glucose reading
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this reading?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const data = await api(`/api/readings/${id}`, {
        method: 'DELETE'
      });

      setSuccess(data.message);

      if (editingId === id) {
        cancelEdit();
      }

      await loadReadings();
      await loadReports();

    } catch (err) {
      setError(err.message);
    }
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);

    setForm({
      date: getToday(),
      timeSlot: 'morning',
      value: ''
    });

    setError('');
    setSuccess('');
  }

  return (
    <section className="dashboard">

      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">YOUR PERSONAL HEALTH SPACE</p>

          <h1>
            Hello, <span>{user.name.split(' ')[0]}.</span>
          </h1>

          <p className="dashboard-subtitle">
            Keep track of your daily glucose readings.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="reports-trigger"
            onClick={() => setShowReports(true)}
          >
            <Activity size={18} />
            View reports
          </button>

          <div className="dashboard-count">
            <Activity size={22} />
            <strong>{readings.length}</strong>
            <small>Total readings</small>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* Add or edit reading form */}
        <section className="reading-card">
          <p className="eyebrow">
            {editingId ? 'EDIT READING' : 'NEW READING'}
          </p>

          <h2>
            {editingId ? 'Update your reading' : 'Add glucose reading'}
          </h2>

          <form onSubmit={handleSave} className="reading-form" noValidate>

            <label className="field">
              <span>Date</span>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={updateReadingField}
                required
              />
            </label>

            <label className="field">
              <span>Time slot</span>

              <select
                name="timeSlot"
                value={form.timeSlot}
                onChange={updateReadingField}
                required
              >
                {timeSlots.map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Glucose value (mg/dl)</span>

              <input
                type="number"
                name="value"
                step="1"
                value={form.value}
                onChange={updateReadingField}
                placeholder="Enter value (40–600)"
                required
              />
            </label>

            {error && (
              <p className="alert error">{error}</p>
            )}

            {success && (
              <p className="alert success">{success}</p>
            )}

            <button
              className="submit-button"
              type="submit"
              disabled={busy}
            >
              {busy
                ? 'Please wait...'
                : editingId
                  ? 'Update reading'
                  : 'Save reading'}

              <Check size={18} />
            </button>

            {editingId && (
              <button
                className="cancel-button"
                type="button"
                onClick={cancelEdit}
              >
                <X size={16} />
                Cancel editing
              </button>
            )}

          </form>
        </section>

        {/* Reading history */}
        <section className="history-card">

          <div className="history-heading">
            <div>
              <p className="eyebrow">YOUR RECORDS</p>
              <h2>Reading history</h2>
            </div>

            <Activity color="#b52b35" size={23} />
          </div>

          {loading ? (
            <p className="empty-state">
              Loading readings...
            </p>
          ) : readings.length === 0 ? (
            <p className="empty-state">
              No readings yet. Add your first glucose reading!
            </p>
          ) : (
            <div className="reading-list">

              {readings.map(reading => {
                const slot = timeSlots.find(
                  item => item.value === reading.time_slot
                );

                return (
                  <article
                    className="reading-item"
                    key={reading.id}
                  >
                    <div className="reading-info">
                      <strong>
                        {reading.glucose_value} mg/dl
                      </strong>

                      <span>
                        {slot?.label || reading.time_slot}
                      </span>

                      <small>
                        {String(reading.reading_date).slice(0, 10)}
                      </small>
                    </div>

                    <div className="reading-actions">

                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleEdit(reading)}
                        aria-label="Edit reading"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() => handleDelete(reading.id)}
                        aria-label="Delete reading"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </section>

      </div>

      {/* Reports  */}
      {showReports && (
        <div
          className="reports-overlay"
          onClick={() => setShowReports(false)}
          role="presentation"
        >
          <section
            className="reports-section"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reports-title"
            onClick={event => event.stopPropagation()}
          >
        <div className="reports-heading">
          <div>
            <p className="eyebrow">YOUR INSIGHTS</p>
            <h2 id="reports-title">Glucose reports</h2>
            <p className="reports-subtitle">Review your readings across different time periods.</p>
          </div>

          <label className="report-date-field">
            <span>Report date</span>
            <input
              type="date"
              value={reportDate}
              max={getToday()}
              onChange={event => setReportDate(event.target.value)}
            />
          </label>
        </div>

        <div className="report-tabs" role="tablist" aria-label="Report period">
          <button type="button" role="tab" aria-selected={reportType === 'daily'} className={reportType === 'daily' ? 'active' : ''} onClick={() => setReportType('daily')}>Daily</button>
          <button type="button" role="tab" aria-selected={reportType === 'monthToDate'} className={reportType === 'monthToDate' ? 'active' : ''} onClick={() => setReportType('monthToDate')}>Month-to-date</button>
          <button type="button" role="tab" aria-selected={reportType === 'monthly'} className={reportType === 'monthly' ? 'active' : ''} onClick={() => setReportType('monthly')}>Previous month</button>
        </div>

        {reportLoading ? (
          <p className="empty-state">Loading report...</p>
        ) : reportError ? (
          <p className="alert error">{reportError}</p>
        ) : selectedReport ? (
          <>
            <p className="report-range">
              {selectedRange?.startDate === selectedRange?.endDate
                ? formatReportDate(selectedRange.startDate)
                : `${formatReportDate(selectedRange?.startDate)} – ${formatReportDate(selectedRange?.endDate)}`}
            </p>

            {selectedReport.count === 0 ? (
              <div className="report-empty">
                <Activity size={25} />
                <strong>No readings for this period</strong>
                <p>Add glucose readings to see your highest, lowest, and average values here.</p>
              </div>
            ) : (
              <>
                <div className="report-stats">
                  <article className="report-stat">
                    <span>Highest</span>
                    <strong>{selectedReport.highest}</strong>
                    <small>mg/dl</small>
                  </article>
                  <article className="report-stat">
                    <span>Lowest</span>
                    <strong>{selectedReport.lowest}</strong>
                    <small>mg/dl</small>
                  </article>
                  <article className="report-stat">
                    <span>Average</span>
                    <strong>{Number(selectedReport.average).toFixed(1)}</strong>
                    <small>mg/dl</small>
                  </article>
                  <article className="report-stat">
                    <span>Readings</span>
                    <strong>{selectedReport.count}</strong>
                    <small>total entries</small>
                  </article>
                </div>

                {reportType === 'daily' && selectedReport.readings?.length > 0 && (
                  <div className="daily-report-readings">
                    <h3>Readings for the day</h3>
                    {selectedReport.readings.map(reading => {
                      const slot = timeSlots.find(item => item.value === reading.time_slot);
                      return (
                        <div className="daily-report-item" key={reading.id}>
                          <span>{slot?.label || reading.time_slot}</span>
                          <strong>{reading.glucose_value} mg/dl</strong>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}
            <div className="reports-modal-footer">
              <button
                type="button"
                className="reports-close-button"
                onClick={() => setShowReports(false)}
              >
                Close reports
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

// Main 
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

  // Check already logged in
  useEffect(() => {
    api('/api/auth/me')
      .then(data => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle authentication form changes
  function updateField(event) {
    const { name, value } = event.target;

    setForm(current => ({
      ...current,
      [name]: value
    }));
  }

  // Register or log in
  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setBusy(true);

    const endpoint =
      mode === 'register'
        ? '/api/auth/register'
        : '/api/auth/login';

    const requestBody =
      mode === 'register'
        ? form
        : {
            email: form.email,
            password: form.password
          };

    try {
      const data = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      setUser(data.user);

      setForm({
        name: '',
        email: '',
        password: ''
      });

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

  // Log out
  async function handleLogout() {
    try {
      await api('/api/auth/logout', {
        method: 'POST'
      });
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

      {/* Header */}
      <header className="topbar">

        <a className="brand" href="#home">
          <Logo />
          <span className="brand-name">
            sweety<span>.</span>
          </span>
        </a>

        <div className="topbar-right">

          <span className="privacy-note">
            <ShieldCheck size={16} />
            Secure personal health tracking
          </span>

          {user && (
            <button
              className="text-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          )}

        </div>
      </header>

      {/* Only ONE ternary condition */}
      {user ? (

        // Logged-in 
        <Dashboard user={user} />

      ) : (

        // Logged-out 
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

          {/* Login and registration card */}
          <section className="auth-card">

            <div className="card-heading">
              <div>
                <p className="eyebrow">YOUR PERSONAL SPACE</p>

                <h2>
                  {mode === 'register'
                    ? 'Create account'
                    : 'Welcome back'}
                </h2>

                <p>
                  {mode === 'register'
                    ? 'Enter your details to get started.'
                    : 'Sign in to access your account.'}
                </p>
              </div>

              <Logo />
            </div>

            {/* Switch between registration and login */}
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

            {/* Authentication form */}
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
                      mode === 'register'
                        ? 'new-password'
                        : 'current-password'
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
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>

                </div>

                {mode === 'register' && (
                  <small className="field-hint">
                    Password must contain 8–72 characters.
                  </small>
                )}
              </label>

              {error && (
                <p className="alert error">{error}</p>
              )}

              {success && (
                <p className="alert success">{success}</p>
              )}

              <button
                className="submit-button"
                type="submit"
                disabled={busy}
              >
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

      {/* Footer */}
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
