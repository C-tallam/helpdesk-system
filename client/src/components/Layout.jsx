import { Link, NavLink, Outlet } from 'react-router-dom';
import { LifeBuoy, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const staff = user.role !== 'user';
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link to="/" className="brand"><LifeBuoy size={20} aria-hidden="true" /> HelpDesk</Link>
          <nav aria-label="Main">
            {staff && <NavLink to="/dashboard">Dashboard</NavLink>}
            <NavLink to="/tickets" end>{staff ? 'All tickets' : 'My tickets'}</NavLink>
            <NavLink to="/tickets/new">New ticket</NavLink>
          </nav>
          <div className="user">
            <span className="user-name">{user.name}</span>
            <span className="role">{user.role}</span>
            <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} aria-hidden="true" /></button>
          </div>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}
