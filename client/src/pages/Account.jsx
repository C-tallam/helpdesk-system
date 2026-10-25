import { useState } from 'react';
import { Check, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { api, errorText } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

function PasswordField({ id, label, value, onChange, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} name={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} required minLength={minLength} maxLength={72} autoComplete={autoComplete} />
        <button type="button" className="pw-toggle" aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={show} onClick={() => setShow((s) => !s)}>
          {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const onChange = (e) => { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); setDone(false); setError(''); };

  const rules = [
    { ok: form.newPassword.length >= 8, text: 'At least 8 characters' },
    { ok: form.newPassword.length > 0 && form.newPassword === form.confirm, text: 'Both new passwords match' },
    { ok: form.newPassword.length > 0 && form.currentPassword.length > 0 && form.newPassword !== form.currentPassword, text: 'Different from your current password' },
  ];
  const valid = form.currentPassword && rules.every((r) => r.ok);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true); setError(''); setDone(false);
    try {
      await api.post('/api/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setDone(true);
      toast.success('Password changed successfully');
    } catch (err) {
      setError(errorText(err));
    }
    setBusy(false);
  };

  return (
    <>
      <div className="page-head"><h1>Account</h1></div>
      <section className="panel narrow">
        <h2>Profile</h2>
        <dl className="facts">
          <dt>Name</dt><dd>{user.name}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Role</dt><dd>{user.role}</dd>
        </dl>
      </section>

      <form className="panel narrow form-stack" onSubmit={onSubmit}>
        <h2>Change password</h2>
        {user.demo ? <p className="muted">Demo accounts are shared, so their password can’t be changed.</p> : (
          <>
            {done && (
              <div className="banner" role="status">
                <CheckCircle2 size={20} aria-hidden="true" />
                <div><strong>Password changed successfully.</strong><br />Your new password is active. You stay signed in on this device, and you’ll use the new password next time you sign in.</div>
              </div>
            )}
            <PasswordField id="currentPassword" label="Current password" value={form.currentPassword} onChange={onChange} autoComplete="current-password" />
            <PasswordField id="newPassword" label="New password" value={form.newPassword} onChange={onChange} autoComplete="new-password" minLength={8} />
            <PasswordField id="confirm" label="Confirm new password" value={form.confirm} onChange={onChange} autoComplete="new-password" minLength={8} />
            <ul className="rules" aria-label="Password requirements">
              {rules.map((r) => (
                <li key={r.text} className={r.ok ? 'ok' : ''}>
                  {r.ok ? <Check size={14} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />} {r.text}
                </li>
              ))}
            </ul>
            <div role="alert" className="form-error">{error}</div>
            <div><button className="btn primary" disabled={busy || !valid}>{busy ? 'Saving…' : 'Change password'}</button></div>
          </>
        )}
      </form>
    </>
  );
}
