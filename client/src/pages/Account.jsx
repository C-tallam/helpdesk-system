import { useState } from 'react';
import { api, errorText } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setMsg({ type: 'error', text: 'The new passwords do not match.' });
    setBusy(true); setMsg({ type: '', text: '' });
    try {
      await api.post('/api/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setMsg({ type: 'error', text: errorText(err) });
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
            <div className="field">
              <label htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" name="currentPassword" type="password" value={form.currentPassword} onChange={onChange} required autoComplete="current-password" />
            </div>
            <div className="field">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" name="newPassword" type="password" value={form.newPassword} onChange={onChange} required minLength={8} maxLength={72} autoComplete="new-password" />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm new password</label>
              <input id="confirm" name="confirm" type="password" value={form.confirm} onChange={onChange} required minLength={8} maxLength={72} autoComplete="new-password" />
            </div>
            <div role="status" className={msg.type === 'error' ? 'form-error' : 'form-ok'}>{msg.text}</div>
            <div><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button></div>
          </>
        )}
      </form>
    </>
  );
}
