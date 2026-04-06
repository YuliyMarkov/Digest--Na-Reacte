import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminCreateArticlePage from './pages/AdminCreateArticlePage.jsx'
import AdminEditArticlePage from './pages/AdminEditArticlePage.jsx'
import AdminReelsPage from './pages/AdminReelsPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/articles/new"
        element={
          <ProtectedRoute>
            <AdminCreateArticlePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/articles/:id/edit"
        element={
          <ProtectedRoute>
            <AdminEditArticlePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reels"
        element={
          <ProtectedRoute>
            <AdminReelsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App