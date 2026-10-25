import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LifeBuoy, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const staff = user.role !== 'user';
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onClick = (e) => { if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  return (
    <>
      <header className="topbar" ref={headerRef}>
        <div className="topbar-in">
          <Link to="/" className="brand"><LifeBuoy size={20} aria-hidden="true" /> HelpDesk</Link>
          <button type="button" className="menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
          <div id="main-menu" className={`menu ${open ? 'open' : ''}`}>
            <nav aria-label="Main">
              {staff && <NavLink to="/dashboard">Dashboard</NavLink>}
              <NavLink to="/tickets" end>{staff ? 'All tickets' : 'My tickets'}</NavLink>
              <NavLink to="/tickets/new">New ticket</NavLink>
              <NavLink to="/account">Account</NavLink>
            </nav>
            <div className="user">
              <span className="user-info"><span className="user-name">{user.name}</span><span className="role">{user.role}</span></span>
              <button type="button" className="logout" onClick={logout}><LogOut size={16} aria-hidden="true" /> Log out</button>
            </div>
          </div>
        </div>
      </header>
      <main className="page"><Outlet /></main>
    </>
  );
}
