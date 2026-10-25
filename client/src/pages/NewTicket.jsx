import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorText } from '../api/client.js';
import { CATEGORIES, PRIORITIES } from '../constants.js';
import { useToast } from '../components/Toast.jsx';

export default function NewTicket() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ title: '', category: 'Other', priority: 'Medium', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const t = await api.post('/api/tickets', form);
      toast.success(`Ticket ${t.key} created`);
      navigate(`/tickets/${t.id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head"><h1>New ticket</h1></div>
      <form className="panel form-grid" onSubmit={onSubmit}>
        <div className="field full">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={form.title} onChange={onChange} required minLength={5} maxLength={150} placeholder="Short summary of the problem" />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={form.category} onChange={onChange}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" value={form.priority} onChange={onChange}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
        </div>
        <div className="field full">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={7} value={form.description} onChange={onChange} required minLength={10} maxLength={5000} placeholder="What happened, when it started, and what you have already tried." />
        </div>
        <div className="full"><div role="alert" className="form-error">{error}</div></div>
        <div className="full"><button className="btn primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit ticket'}</button></div>
      </form>
    </>
  );
}
