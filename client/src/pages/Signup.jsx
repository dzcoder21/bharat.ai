import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from './Auth.module.css';

export default function Signup() {
  const navigate   = useNavigate();
  const { signup } = useAuth();

  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm)
      return setError('Passwords do not match');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#f87171', '#fbbf24', '#4ade80'];

  return (
    <div className={s.page}>
      <div className={s.card}>
        <Link to="/" className={s.logo}>
          <span className={s.lgB}>B</span><span className={s.lgH}>H</span>
          <span className={s.lgA}>A</span><span className={s.lgR}>R</span>
          <span className={s.lgA2}>A</span><span className={s.lgT}>T</span>
          <span className={s.lgAI}>.AI</span>
        </Link>

        <h1 className={s.title}>Create account</h1>
        <p className={s.sub}>Join Bharat.AI — search smarter, for free</p>

        {error && (
          <div className={s.errorBox}><span>⚠️</span> {error}</div>
        )}

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Full Name</label>
            <input className={s.input} type="text" placeholder="Rahul Sharma"
              value={form.name} onChange={set('name')} required autoFocus />
          </div>

          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input className={s.input} type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>

          <div className={s.field}>
            <label className={s.label}>Password</label>
            <div className={s.pwWrap}>
              <input className={s.input} type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 characters" value={form.password}
                onChange={set('password')} required autoComplete="new-password" />
              <button type="button" className={s.pwToggle} onClick={() => setShowPw(v => !v)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {form.password.length > 0 && (
              <div className={s.strengthBar}>
                {[1,2,3].map(i => (
                  <div key={i} className={s.strengthSeg}
                    style={{ background: i <= strength ? strengthColor[strength] : 'var(--border)' }} />
                ))}
                <span style={{ color: strengthColor[strength], fontSize: '.7rem' }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <div className={s.field}>
            <label className={s.label}>Confirm Password</label>
            <input className={s.input} type={showPw ? 'text' : 'password'}
              placeholder="Re-enter password" value={form.confirm}
              onChange={set('confirm')} required />
          </div>

          <button className={s.btnPrimary} type="submit" disabled={loading}>
            {loading ? <span className={s.spinner}/> : null}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={s.terms}>
          By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
        </p>

        <p className={s.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={s.switchLink}>Sign in</Link>
        </p>
      </div>

      <div className={s.bgBlob1}/><div className={s.bgBlob2}/>
    </div>
  );
}
