import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LifeBuoy, MailCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { api, errorText } from '../api/client.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../demo.js';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // set after sign-up: { email, emailSent }
  const [needsVerify, setNeedsVerify] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const resend = async (email) => {
    setBusy(true); setError(''); setInfo('');
    try {
      await api.post('/api/auth/resend-verification', { email });
      setInfo('If that address has an unconfirmed account, a new confirmation email is on its way. Check your spam folder too.');
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setInfo(''); setNeedsVerify(false);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        const d = await register(form.name, form.email, form.password);
        if (d.verificationRequired) { setPending({ email: d.email, emailSent: d.emailSent }); setBusy(false); return; }
      }
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') setNeedsVerify(true);
      setError(errorText(err));
      setBusy(false);
    }
  };

  const demoLogin = async (email) => {
    setBusy(true); setError('');
    try {
      await login(email, DEMO_PASSWORD);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-brand"><MailCheck size={26} aria-hidden="true" /> Check your inbox</div>
          <p>We sent a confirmation link to <strong>{pending.email}</strong>. Click it to activate your account. The link works once and expires in 24 hours.</p>
          <p className="muted">It can take a minute, and it may land in your spam folder.</p>
          {!pending.emailSent && <div className="form-error">We couldn’t send the email just now. Use “Resend” below.</div>}
          <div role="status" className="form-ok">{info}</div>
          <div role="alert" className="form-error">{error}</div>
          <button type="button" className="btn block" disabled={busy} onClick={() => resend(pending.email)}>Resend confirmation email</button>
          <p className="switch"><Link to="/login">Back to sign in</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand"><LifeBuoy size={26} aria-hidden="true" /> HelpDesk</div>
        <h1>{isLogin ? 'Sign in' : 'Create your account'}</h1>
        <p className="muted">{isLogin ? 'Log in to view and manage your support tickets.' : 'Sign up with a real email address. We’ll send you a link to confirm it.'}</p>
        {!isLogin && (
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={onChange} required minLength={2} maxLength={80} autoComplete="name" />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={onChange} required minLength={isLogin ? 1 : 8} maxLength={72} autoComplete={isLogin ? 'current-password' : 'new-password'} />
          {!isLogin && <small className="muted">At least 8 characters.</small>}
        </div>
        <div role="alert" className="form-error">{error}</div>
        <div role="status" className="form-ok">{info}</div>
        {needsVerify && <button type="button" className="btn block" disabled={busy} onClick={() => resend(form.email)}>Resend confirmation email</button>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        <p className="switch">
          {isLogin ? <>No account? <Link to="/register">Sign up</Link></> : <>Already registered? <Link to="/login">Sign in</Link></>}
        </p>
        {isLogin && (
          <div className="demo-box">
            <p><strong>Just looking around?</strong> Use a demo account. It has sample tickets and is reset regularly, so please don’t enter real personal information.</p>
            <div className="demo-btns">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} type="button" className="btn" disabled={busy} onClick={() => demoLogin(a.email)}>{a.label}</button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
