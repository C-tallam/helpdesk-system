import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorText, qs } from '../api/client.js';
import TicketTable from '../components/TicketTable.jsx';

function Stat({ label, value, to, tone }) {
  return (
    <Link to={to} className={`stat ${tone || ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </Link>
  );
}

function Bars({ title, data, total, param }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <ul className="bars">
        {Object.entries(data).map(([k, v]) => (
          <li key={k}>
            <Link to={`/tickets${qs({ [param]: k })}`}>{k}</Link>
            <span className="bar"><span style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></span>
            <span className="mono">{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      api.get('/api/tickets/stats', ctrl.signal),
      api.get(`/api/tickets${qs({ status: 'Open', assigned: 'unassigned', limit: 8 })}`, ctrl.signal),
    ])
      .then(([s, q]) => { setStats(s); setQueue(q.items); })
      .catch((e) => { if (!ctrl.signal.aborted) setError(errorText(e)); });
    return () => ctrl.abort();
  }, []);

  if (error) return <div role="alert" className="form-error">{error}</div>;
  if (!stats) return <p className="center-note" role="status">Loading dashboard…</p>;

  return (
    <>
      <div className="page-head"><h1>Dashboard</h1></div>
      <div className="stats">
        <Stat label="Total tickets" value={stats.total} to="/tickets" />
        <Stat label="Open" value={stats.byStatus.Open} to="/tickets?status=Open" tone="blue" />
        <Stat label="In progress" value={stats.byStatus['In Progress']} to="/tickets?status=In%20Progress" tone="amber" />
        <Stat label="Unassigned" value={stats.unassigned} to="/tickets?assigned=unassigned" tone="red" />
        <Stat label="Assigned to me" value={stats.assignedToMe} to="/tickets?assigned=me" />
        <Stat label="Resolved" value={stats.byStatus.Resolved} to="/tickets?status=Resolved" tone="green" />
      </div>
      <div className="two-col">
        <Bars title="By priority" data={stats.byPriority} total={stats.total} param="priority" />
        <Bars title="By category" data={stats.byCategory} total={stats.total} param="category" />
      </div>
      <h2 className="sub-h">Needs attention: open and unassigned</h2>
      <TicketTable items={queue} showRequester emptyText="Nothing waiting. All open tickets are assigned." />
    </>
  );
}
