import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard, FileText, Map, BarChart3, LogOut,
  User, ChevronDown, Bell, Menu, X, PlusCircle, Search
} from 'lucide-react'

export default function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    isLoggedIn && { to: '/track', label: 'Track Complaint' },
    isLoggedIn && { to: '/map', label: 'Complaint Map' },
    isLoggedIn && { to: '/transparency', label: 'Transparency' },
  ].filter(Boolean)

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-emblem">🏛️</div>
          <div className="navbar-titles">
            <span className="navbar-title">Delhi Grievance Portal</span>
            <span className="navbar-subtitle">Government of NCT of Delhi</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
              Admin Panel
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              <Link to="/submit" className="btn btn-accent btn-sm">
                <PlusCircle size={15} />
                File Complaint
              </Link>
              <div style={{ position: 'relative' }}>
                <button
                  className="user-avatar"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  id="user-menu-btn"
                >
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '46px',
                    background: 'white', borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
                    minWidth: '200px', zIndex: 1000, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>{user?.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{user?.email}</div>
                    </div>
                    <Link to="/my-complaints" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', fontSize: '0.875rem', color: '#374151', transition: 'background 0.15s' }}
                      onClick={() => setUserMenuOpen(false)}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <FileText size={15} /> My Complaints
                    </Link>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', fontSize: '0.875rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            location.pathname !== '/' && (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => setUserMenuOpen(false)} />
      )}
    </nav>
  )
}
