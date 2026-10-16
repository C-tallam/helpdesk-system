import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './Badges.jsx';
import { timeAgo } from '../utils.js';

export default function TicketTable({ items, showRequester, emptyText = 'No tickets found.' }) {
  return (
    <div className="table-wrap">
      <table className="grid">
        <thead>
          <tr>
            <th>Ticket</th><th>Title</th><th>Status</th><th>Priority</th><th>Category</th>
            {showRequester && <th>Requester</th>}
            <th>Assignee</th><th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan={showRequester ? 8 : 7} className="empty">{emptyText}</td></tr>}
          {items.map((t) => (
            <tr key={t.id}>
              <td className="mono"><Link to={`/tickets/${t.id}`}>{t.key}</Link></td>
              <td className="title-cell"><Link to={`/tickets/${t.id}`}>{t.title}</Link></td>
              <td><StatusBadge value={t.status} /></td>
              <td><PriorityBadge value={t.priority} /></td>
              <td>{t.category}</td>
              {showRequester && <td>{t.createdBy?.name || '—'}</td>}
              <td>{t.assignedTo?.name || <span className="muted">Unassigned</span>}</td>
              <td className="muted nowrap">{timeAgo(t.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
