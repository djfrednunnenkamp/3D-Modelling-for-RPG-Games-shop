import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-accent">&#9632;</span> PEÇAS 3D
      </Link>
      <div className="navbar-links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/catalogo" className={pathname.startsWith('/catalogo') || pathname.startsWith('/produto') ? 'active' : ''}>
          Catalog
        </Link>
        <Link to="/personalizado" className={`nav-custom ${pathname === '/personalizado' ? 'active' : ''}`}>
          ✦ Custom Order
        </Link>
      </div>
    </nav>
  )
}
