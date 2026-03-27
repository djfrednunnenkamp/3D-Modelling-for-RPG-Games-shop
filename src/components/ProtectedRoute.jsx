import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading">Carregando...</div>
  if (!user) return <Navigate to="/admin/login" replace />

  return children
}
