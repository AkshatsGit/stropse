import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const { login, signup, loginWithGoogle, user } = useAuth();
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

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast('Welcome to STROPSE! ⚡', 'success');
      navigate('/');
    } catch (err) {
      toast(err.message, 'error');
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
          <div style={{ width: 40, height: 40, flexShrink: 0 }}>
            <img src="/stropse-seal.png" alt="STROPSE" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />
          </div>
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

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 4px' }}>
              <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
              <span style={{ color: '#555', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 2 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '12px 20px',
                background: '#fff',
                color: '#111',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'opacity 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.695 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

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
