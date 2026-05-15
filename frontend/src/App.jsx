import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SubmitComplaintPage from './pages/SubmitComplaintPage'
import TrackComplaintPage from './pages/TrackComplaintPage'
import MyComplaintsPage from './pages/MyComplaintsPage'
import ComplaintMapPage from './pages/ComplaintMapPage'
import TransparencyDashboard from './pages/TransparencyDashboard'
import AdminDashboard from './pages/AdminDashboard'
import DepartmentPerformancePage from './pages/DepartmentPerformancePage'

// Auth Guards
function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

// Standard page layout (with Navbar + Footer)
function StandardLayout({ children, noFooter = false }) {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">{children}</main>
      {!noFooter && <Footer />}
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<StandardLayout><HomePage /></StandardLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track" element={<PrivateRoute><StandardLayout><TrackComplaintPage /></StandardLayout></PrivateRoute>} />
      <Route path="/track/:complaintId" element={<PrivateRoute><StandardLayout><TrackComplaintPage /></StandardLayout></PrivateRoute>} />
      <Route path="/map" element={<PrivateRoute><StandardLayout noFooter><ComplaintMapPage /></StandardLayout></PrivateRoute>} />
      <Route path="/transparency" element={<PrivateRoute><StandardLayout><TransparencyDashboard /></StandardLayout></PrivateRoute>} />

      {/* Citizen Protected */}
      <Route path="/submit" element={<PrivateRoute><StandardLayout><SubmitComplaintPage /></StandardLayout></PrivateRoute>} />
      <Route path="/my-complaints" element={<PrivateRoute><StandardLayout><MyComplaintsPage /></StandardLayout></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><StandardLayout><MyComplaintsPage /></StandardLayout></PrivateRoute>} />

      {/* Admin Protected */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/dept-performance" element={<AdminRoute><StandardLayout><DepartmentPerformancePage /></StandardLayout></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <StandardLayout>
          <div style={{ textAlign: 'center', padding: '100px 24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
            <h1 style={{ marginBottom: 8 }}>Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Go Home</a>
          </div>
        </StandardLayout>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e2026',
              color: '#fff',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.9rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
