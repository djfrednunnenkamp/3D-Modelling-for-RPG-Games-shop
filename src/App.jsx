import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import AdminLogin from './pages/AdminLogin'
import Admin from './pages/Admin'
import CustomOrder from './pages/CustomOrder'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalogo" element={<Catalog />} />
                  <Route path="/produto/:id" element={<ProductDetail />} />
                  <Route path="/personalizado" element={<CustomOrder />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
