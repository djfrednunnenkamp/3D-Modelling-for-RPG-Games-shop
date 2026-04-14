import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on navigation
  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <img src="/favicon.png" alt="Dungeon Prints" className="navbar-logo" />
          Dungeon Prints
        </Link>

        {/* Desktop center links */}
        <div className="navbar-links">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/catalogo" className={pathname.startsWith('/catalogo') || pathname.startsWith('/produto') ? 'active' : ''}>
            Catalog
          </Link>
        </div>

        <div className="navbar-right">
          <Link to="/personalizado" className={`nav-custom ${pathname === '/personalizado' ? 'active' : ''}`}>
            ✦ Custom Order
          </Link>
          {user && (
            <Link to="/admin" className="nav-admin">Admin</Link>
          )}
          {/* Hamburger — mobile only */}
          <button
            className={`navbar-burger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(m => !m)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/catalogo" className={pathname.startsWith('/catalogo') || pathname.startsWith('/produto') ? 'active' : ''}>
            Catalog
          </Link>
          <Link to="/personalizado" className={pathname === '/personalizado' ? 'active' : ''}>
            ✦ Custom Order
          </Link>
          {user && <Link to="/admin">Admin</Link>}
        </div>
      )}
    </>
  )
}
