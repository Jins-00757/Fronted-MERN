import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import { Signup } from './pages/Signup';
import { Navbar } from './components/Navbar';
import { Footer } from './components/layout/Footer';
import { SalesforceConnect } from './components/salesforce/SalesforceConnect';
import { OpportunitiesList } from './components/salesforce/OpportunitiesList';
import api from './services/api';
import './styles/global.css';

/**
 * App Component - Main application routing and layout
 * Integrates authentication, session management, and Salesforce OAuth
 * Day 3: Salesforce OAuth integration with opportunities management
 */

function App() {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const [showSalesforceModal, setShowSalesforceModal] = useState(false);

  // The Salesforce OAuth exchange happens entirely on the backend; it
  // redirects back here with a plain `sf`/`sfError` flag (never a code).
  // Read that once, synchronously, as the initial state - not inside an
  // effect - since it's derived purely from the URL this component mounted
  // with.
  const [salesforceNotice, setSalesforceNotice] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('sf');
    const sfError = params.get('sfError');

    if (!connected && !sfError) return null;

    return connected
      ? { type: 'success', message: 'Salesforce account connected successfully.' }
      : { type: 'error', message: 'Could not connect your Salesforce account. Please try again.' };
  });

  // Side effects that don't touch React state - cleaning the URL and
  // auto-dismissing the banner - still belong in an effect.
  useEffect(() => {
    if (!salesforceNotice) return undefined;

    window.history.replaceState({}, document.title, window.location.pathname);
    const timer = setTimeout(() => setSalesforceNotice(null), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the notice this component mounted with
  }, []);

  // Show the full-page loader only while the initial session restore is in
  // flight - never for a subsequent login/signup attempt (see isInitializing
  // vs isLoading note in AuthProvider.jsx).
  if (isInitializing) {
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
      {isAuthenticated && <Navbar onSalesforceClick={() => setShowSalesforceModal(true)} />}

      {salesforceNotice && (
        <div
          role="status"
          style={{
            margin: '1rem auto 0',
            maxWidth: '640px',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            textAlign: 'center',
            background: salesforceNotice.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: salesforceNotice.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${salesforceNotice.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {salesforceNotice.message}
        </div>
      )}

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
                <Dashboard
                  onSalesforceConnect={() => setShowSalesforceModal(true)}
                  salesforceConnected={user?.isSalesforceConnected}
                />
              </ProtectedRoute>
            }
          />

          {/* Opportunities Route - Day 3 Feature */}
          <Route
            path="/opportunities"
            element={
              <ProtectedRoute>
                <OpportunitiesList />
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

      {/* Salesforce Connect Modal - Day 3 Feature */}
      {isAuthenticated && showSalesforceModal && (
        <SalesforceConnect
          onClose={() => setShowSalesforceModal(false)}
          isConnected={user?.isSalesforceConnected}
        />
      )}

      <Footer />
    </div>
  );
}

/**
 * Dashboard Component
 * Displays user profile, Salesforce connection status, and key metrics
 * Day 3: Enhanced with Salesforce integration and opportunity count
 */

function Dashboard({ onSalesforceConnect, salesforceConnected }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    // Nothing to fetch when disconnected - the JSX below only reads `stats`
    // when `salesforceConnected` is true, so stale stats are never shown.
    if (!salesforceConnected) {
      return undefined;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    setStatsLoading(true);

    const fetchStats = async () => {
      try {
        const [opportunitiesRes, pipelineRes] = await Promise.all([
          api.get('/data/opportunities'),
          api.get('/data/pipeline-summary'),
        ]);

        if (cancelled) return;

        const opportunities = opportunitiesRes.data.success ? opportunitiesRes.data.data : [];
        const pipeline = pipelineRes.data.success ? pipelineRes.data.data : null;

        const closedWon = pipeline?.stageBreakdown?.find((s) => s.stage === 'Closed Won');
        const pipelineValue = opportunities.reduce((sum, opp) => sum + (opp.Amount || 0), 0);

        setStats({
          activeDeals: opportunities.length,
          closedWon: closedWon?.count || 0,
          pipelineValue,
        });
      } catch (error) {
        console.error('Error fetching Salesforce stats:', error);
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [salesforceConnected]);

  const opportunityCount = stats?.activeDeals ?? 0;

  return (
    <div className="container">
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>Sales Pipeline Intelligence</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Welcome back, {user?.name || 'User'}!</p>
      </div>

      {/* Salesforce Connection Status - Day 3 */}
      <div style={{
        background: salesforceConnected ? '#f0fdf4' : '#fef2f2',
        border: `2px solid ${salesforceConnected ? '#10b981' : '#ef4444'}`,
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#1f2937' }}>
              {salesforceConnected ? '✓' : '○'} Salesforce Connection
            </h3>
            <p style={{
              margin: 0,
              color: salesforceConnected ? '#10b981' : '#ef4444',
              fontSize: '0.9rem'
            }}>
              {salesforceConnected
                ? `Connected as ${user?.salesforceOrgName || 'Salesforce Org'}`
                : 'Not connected'}
            </p>
          </div>
          {!salesforceConnected && (
            <button
              onClick={onSalesforceConnect}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
              onMouseOver={(e) => e.target.style.background = '#5568d3'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              Connect Salesforce
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Active Deals Card */}
        <div style={{
          padding: '1.5rem',
          background: '#f0f9ff',
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
            ACTIVE DEALS
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {salesforceConnected ? (statsLoading ? '…' : stats?.activeDeals ?? 0) : '0'}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#999',
            marginTop: '0.75rem'
          }}>
            {salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : 'Open deals') : 'Connect Salesforce to view'}
          </div>
        </div>

        {/* Closed Won Card */}
        <div style={{
          padding: '1.5rem',
          background: '#cfbff4',
          borderRadius: '8px',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
            CLOSED WON
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {salesforceConnected ? (statsLoading ? '…' : stats?.closedWon ?? 0) : '0'}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#999',
            marginTop: '0.75rem'
          }}>
            {salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : 'Deals won') : 'Connect Salesforce to view'}
          </div>
        </div>

        {/* Pipeline Value Card */}
        <div style={{
          padding: '1.5rem',
          background: '#fef2f2',
          borderRadius: '8px',
          borderLeft: '4px solid #ef4444',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
            PIPELINE VALUE
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>
            {salesforceConnected ? (statsLoading ? '…' : `$${(stats?.pipelineValue ?? 0).toLocaleString()}`) : '$0'}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#999',
            marginTop: '0.75rem'
          }}>
            {salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : 'Open pipeline') : 'Connect Salesforce to view'}
          </div>
        </div>

        {/* Opportunities Count Card - Day 3 */}
        <div style={{
          padding: '1.5rem',
          background: '#fef3c7',
          borderRadius: '8px',
          borderLeft: '4px solid #f59e0b',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
            OPPORTUNITIES
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {salesforceConnected ? (statsLoading ? '…' : opportunityCount) : '0'}
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {salesforceConnected ? (
              <Link to="/opportunities" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
                View all opportunities →
              </Link>
            ) : (
              <span style={{ color: '#999' }}>Connect Salesforce to view</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div style={{
        background: '#f9fafb',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: 0, marginBottom: '1rem', color: '#1f2937', fontSize: '1.1rem' }}>
          Profile Information
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Email</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{user?.email}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Role</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
              {user?.role || 'User'}
            </p>
          </div>
          {user?.company && (
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Company</p>
              <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{user.company}</p>
            </div>
          )}
          {user?.jobTitle && (
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Job Title</p>
              <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{user.jobTitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
