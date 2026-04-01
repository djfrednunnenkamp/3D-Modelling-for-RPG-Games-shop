import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/favicon.png" alt="Dungeon Prints" className="navbar-logo" />
      </Link>
      <div className="navbar-links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/catalogo" className={pathname.startsWith('/catalogo') || pathname.startsWith('/produto') ? 'active' : ''}>
          Catalog
        </Link>
      </div>
      <Link to="/personalizado" className={`nav-custom ${pathname === '/personalizado' ? 'active' : ''}`}>
        ✦ Custom Order
      </Link>
    </nav>
  )
}
