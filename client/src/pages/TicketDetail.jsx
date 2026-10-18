import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Lock, Send } from 'lucide-react';
import { api, errorText } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badges.jsx';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js';
import { fmtDateTime } from '../utils.js';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const staff = user.role !== 'user';
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setTicket(null); setNotFound(false); setError('');
    Promise.all([
      api.get(`/api/tickets/${id}`, ctrl.signal),
      api.get(`/api/tickets/${id}/comments`, ctrl.signal),
      staff ? api.get('/api/users/agents', ctrl.signal) : Promise.resolve([]),
    ])
      .then(([t, c, a]) => { setTicket(t); setComments(c); setAgents(a); })
      .catch((e) => { if (ctrl.signal.aborted) return; if (e.status === 404 || e.status === 400) setNotFound(true); else setError(errorText(e)); });
    return () => ctrl.abort();
  }, [id, staff]);

  const update = async (patch) => {
    setError('');
    try { setTicket(await api.patch(`/api/tickets/${id}`, patch)); } catch (e) { setError(errorText(e)); }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError('');
    try {
      const c = await api.post(`/api/tickets/${id}/comments`, { text, internal: staff && internal });
      setComments((list) => [...list, c]);
      setText(''); setInternal(false);
    } catch (err) { setError(errorText(err)); }
    setBusy(false);
  };

  if (notFound) return <p className="center-note">Ticket not found. <Link to="/tickets">Back to tickets</Link></p>;
  if (!ticket) return <><div role="alert" className="form-error">{error}</div><p className="center-note" role="status">Loading ticket…</p></>;

  const closed = ticket.status === 'Closed';
  const select = (label, field, options) => (
    <div className="field">
      <label htmlFor={field}>{label}</label>
      <select id={field} value={ticket[field]} onChange={(e) => update({ [field]: e.target.value })}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <Link to="/tickets" className="back"><ChevronLeft size={16} aria-hidden="true" /> Tickets</Link>
      <div className="page-head">
        <h1><span className="mono muted">{ticket.key}</span> {ticket.title}</h1>
        <div className="badges"><StatusBadge value={ticket.status} /><PriorityBadge value={ticket.priority} /></div>
      </div>
      <div role="alert" className="form-error">{error}</div>

      <div className="detail-grid">
        <div>
          <section className="panel">
            <h2>Description</h2>
            <p className="pre">{ticket.description}</p>
          </section>

          <section className="panel">
            <h2>Comments ({comments.length})</h2>
            {comments.length === 0 && <p className="muted">No comments yet.</p>}
            <ul className="comments">
              {comments.map((c) => (
                <li key={c.id} className={c.internal ? 'internal' : ''}>
                  <div className="c-head">
                    <strong>{c.author?.name || 'Deleted user'}</strong>
                    {c.author && c.author.role !== 'user' && <span className="role">{c.author.role}</span>}
                    {c.internal && <span className="note-tag"><Lock size={12} aria-hidden="true" /> Internal note</span>}
                    <span className="muted">{fmtDateTime(c.createdAt)}</span>
                  </div>
                  <p className="pre">{c.text}</p>
                </li>
              ))}
            </ul>
            {closed && !staff ? <p className="muted">This ticket is closed. Open a new ticket if you need more help.</p> : (
              <form onSubmit={postComment} className="comment-form">
                <label htmlFor="comment" className="sr">Add a comment</label>
                <textarea id="comment" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" maxLength={2000} required />
                <div className="comment-actions">
                  {staff && <label className="check"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (hidden from requester)</label>}
                  <button className="btn primary" disabled={busy}><Send size={15} aria-hidden="true" /> {busy ? 'Sending…' : 'Comment'}</button>
                </div>
              </form>
            )}
          </section>
        </div>

        <aside>
          <section className="panel">
            <h2>Details</h2>
            <dl className="facts">
              <dt>Requester</dt><dd>{ticket.createdBy?.name || '—'}</dd>
              <dt>Created</dt><dd>{fmtDateTime(ticket.createdAt)}</dd>
              <dt>Updated</dt><dd>{fmtDateTime(ticket.updatedAt)}</dd>
              {ticket.resolvedAt && <><dt>Resolved</dt><dd>{fmtDateTime(ticket.resolvedAt)}</dd></>}
              {!staff && <><dt>Category</dt><dd>{ticket.category}</dd><dt>Assignee</dt><dd>{ticket.assignedTo?.name || 'Not assigned yet'}</dd></>}
            </dl>
            {staff && (
              <div className="controls">
                {select('Status', 'status', STATUSES)}
                {select('Priority', 'priority', PRIORITIES)}
                {select('Category', 'category', CATEGORIES)}
                <div className="field">
                  <label htmlFor="assignedTo">Assignee</label>
                  <select id="assignedTo" value={ticket.assignedTo?.id || ''} onChange={(e) => update({ assignedTo: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            {!staff && !closed && <button className="btn ghost block" onClick={() => update({ status: 'Closed' })}>Close this ticket</button>}
          </section>

          <section className="panel">
            <h2>Activity</h2>
            <ul className="activity">
              {[...ticket.activity].reverse().map((a, i) => (
                <li key={i}><span>{a.detail}</span><small className="muted">{a.by?.name || 'Unknown'} · {fmtDateTime(a.at)}</small></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
