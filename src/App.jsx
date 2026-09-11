import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import { Signup } from './pages/Signup';
import { Navbar } from './components/Navbar';
import { Footer } from './components/layout/Footer';
import "./styles/global.css"

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading only on app initialization, not on every route
  if (isLoading && !isAuthenticated) {
    return (
      <div className="app-layout">
        <div className="app-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-center">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Only show Navbar when authenticated */}
      {isAuthenticated && <Navbar />}

      <main className="app-content">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home or login */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div style={{
        background: '#f5f5f5',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h1>Welcome to Sales Pipeline Intelligence</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>Hello, {user?.name || 'User'}!</p>
        {user?.salesforceUserId && (
          <p style={{ color: 'green', marginTop: '0.5rem' }}>✓ Salesforce Connected</p>
        )}
      </div>

      {/* Dashboard stats placeholder */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: '#f0f9ff',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>0</div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>Active Deals</div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: '#f0fdf4',
          borderRadius: '8px',
          borderLeft: '4px solid #10b981'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>0</div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>Closed Won</div>
        </div>

        <div style={{
          padding: '1.5rem',
          background: '#fef2f2',
          borderRadius: '8px',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>$0</div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>Pipeline Value</div>
        </div>
      </div>
    </div>
  );
}

export default App;