import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from './Auth.module.css';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const from = location.state?.from || '/';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        {/* Logo */}
        <Link to="/" className={s.logo}>
          <span className={s.lgB}>B</span><span className={s.lgH}>H</span>
          <span className={s.lgA}>A</span><span className={s.lgR}>R</span>
          <span className={s.lgA2}>A</span><span className={s.lgT}>T</span>
          <span className={s.lgAI}>.AI</span>
        </Link>

        <h1 className={s.title}>Welcome back</h1>
        <p className={s.sub}>Sign in to your Bharat.AI account</p>

        {error && (
          <div className={s.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className={s.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required autoFocus autoComplete="email"
            />
          </div>

          <div className={s.field}>
            <div className={s.labelRow}>
              <label className={s.label}>Password</label>
            </div>
            <div className={s.pwWrap}>
              <input
                className={s.input}
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={set('password')}
                required autoComplete="current-password"
              />
              <button type="button" className={s.pwToggle} onClick={() => setShowPw(v => !v)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button className={s.btnPrimary} type="submit" disabled={loading}>
            {loading ? <span className={s.spinner}/> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={s.switchText}>
          Don't have an account?{' '}
          <Link to="/signup" className={s.switchLink}>Create one</Link>
        </p>
      </div>

      {/* Bg decoration */}
      <div className={s.bgBlob1}/>
      <div className={s.bgBlob2}/>
    </div>
  );
}
