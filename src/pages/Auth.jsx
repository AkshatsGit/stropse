import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const { login, signup, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (user) { navigate('/'); return null; }

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast('Welcome back, warrior! ⚡', 'success');
        navigate('/');
      } else {
        if (!form.name || !form.username) { toast('All fields required', 'error'); setLoading(false); return; }
        await signup(form.email, form.password, form.name, form.username);
        toast('Account created! Welcome to STROPSE 🎮', 'success');
        navigate('/');
      }
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'Email already in use',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/weak-password': 'Password must be 6+ characters',
        'auth/user-not-found': 'No account with that email',
        'auth/wrong-password': 'Incorrect password',
      };
      toast(messages[err.code] || err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />
      <div className="auth-glow" />

      <div className="auth-container">
        {/* Brand */}
        <Link to="/" className="auth-brand">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#FFD700" strokeWidth="2.5" opacity="0.8"/>
            <path d="M30 75 L50 20 L62 50 L50 45 L70 75" fill="#FFD700"/>
          </svg>
          <span className="auth-brand-name">STROPSE</span>
        </Link>

        <div className="auth-card">
          {/* Toggle */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
              onClick={() => setMode('login')}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`}
              onClick={() => setMode('signup')}
            >Create Account</button>
          </div>

          <div className="auth-card-body">
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome Back, Warrior' : 'Join the Elite'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Sign in to access tournaments, your player cards, and the community.'
                : 'Create your account and start competing on STROPSE.'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      name="name"
                      type="text"
                      className="form-input"
                      placeholder="Akshat Kumar"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      name="username"
                      type="text"
                      className="form-input"
                      placeholder="ProSniper99"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading
                  ? 'Processing...'
                  : mode === 'login' ? '⚡ Enter the Arena' : '⚡ Create My Account'}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="auth-switch-btn">
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <p className="auth-tagline">Play · Improve · Compete · Dominate</p>
      </div>
    </div>
  );
}
