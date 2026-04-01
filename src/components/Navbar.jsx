import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/favicon.png" alt="Dungeon Prints" className="navbar-logo" />
        Dungeon Prints
      </Link>
      <div className="navbar-links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/catalogo" className={pathname.startsWith('/catalogo') || pathname.startsWith('/produto') ? 'active' : ''}>
          Catalog
        </Link>
      </div>
      <div className="navbar-right">
        <Link to="/personalizado" className={`nav-custom ${pathname === '/personalizado' ? 'active' : ''}`}>
          ✦ Custom Order
        </Link>
        {user && (
          <Link to="/admin" className="nav-admin">
            Admin
          </Link>
        )}
      </div>
    </nav>
  )
}
