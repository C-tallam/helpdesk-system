import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { api, errorText, qs } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import TicketTable from '../components/TicketTable.jsx';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js';

const LIMIT = 15;

export default function Tickets() {
  const { user } = useAuth();
  const staff = user.role !== 'user';
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const f = {
    status: params.get('status') || '', priority: params.get('priority') || '',
    category: params.get('category') || '', assigned: params.get('assigned') || '',
    q: params.get('q') || '', page: Number(params.get('page')) || 1,
  };
  const [search, setSearch] = useState(f.q);

  const setParam = (key, value) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (value) n.set(key, value); else n.delete(key);
      if (key !== 'page') n.delete('page');
      return n;
    }, { replace: true });

  useEffect(() => {
    if (search.trim() === f.q) return undefined;
    const t = setTimeout(() => setParam('q', search.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const key = params.toString();
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setError('');
    api.get(`/api/tickets${qs({ ...f, page: f.page, limit: LIMIT })}`, ctrl.signal)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { if (!ctrl.signal.aborted) { setError(errorText(e)); setLoading(false); } });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const select = (name, label, options) => (
    <label className="filter">
      <span className="sr">{label}</span>
      <select value={f[name]} onChange={(e) => setParam(name, e.target.value)} aria-label={label}>
        <option value="">{label}: All</option>
        {options.map((o) => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <div className="page-head">
        <h1>{staff ? 'All tickets' : 'My tickets'}</h1>
        <Link to="/tickets/new" className="btn primary"><Plus size={16} aria-hidden="true" /> New ticket</Link>
      </div>

      <div className="filters">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tickets by title" maxLength={100} />
        </label>
        {select('status', 'Status', STATUSES)}
        {select('priority', 'Priority', PRIORITIES)}
        {select('category', 'Category', CATEGORIES)}
        {staff && select('assigned', 'Assignee', [{ v: 'me', l: 'Assigned to me' }, { v: 'unassigned', l: 'Unassigned' }])}
      </div>

      <div role="alert" className="form-error">{error}</div>
      {loading && !data ? <p className="center-note" role="status">Loading tickets…</p> : data && (
        <div className={loading ? 'fade' : ''}>
          <TicketTable items={data.items} showRequester={staff} emptyText={staff ? 'No tickets match these filters.' : 'You have no tickets yet. Create one with “New ticket”.'} />
          <div className="pager">
            <span className="muted">{data.total} ticket{data.total === 1 ? '' : 's'}</span>
            <div>
              <button className="icon-btn" disabled={data.page <= 1} onClick={() => setParam('page', String(data.page - 1))} aria-label="Previous page"><ChevronLeft size={18} aria-hidden="true" /></button>
              <span className="muted"> Page {data.page} of {Math.max(data.pages, 1)} </span>
              <button className="icon-btn" disabled={data.page >= data.pages} onClick={() => setParam('page', String(data.page + 1))} aria-label="Next page"><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
