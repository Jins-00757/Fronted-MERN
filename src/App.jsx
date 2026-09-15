import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/useAuth';
import { useToast } from './context/useToast';
import Login from './pages/Login';
import { Signup } from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import { Navbar } from './components/Navbar';
import { Footer } from './components/layout/Footer';
import { SalesforceConnect } from './components/salesforce/SalesforceConnect';
import { OpportunitiesList } from './components/salesforce/OpportunitiesList';
import { LeadsBoard } from './components/salesforce/LeadsBoard';
import { ContractsView } from './components/salesforce/ContractsView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SaaSMetricsDashboard } from './components/SaaSMetricsDashboard';
import { AdvancedSearch } from './components/AdvancedSearch';
import BulkOperations from './pages/BulkOperations';
import api from './services/api';
import { MetricCard } from './components/ui/ReportWidgets';
import { gridVariants } from './components/ui/reportWidgetUtils';
import { BriefcaseIcon, CheckCircleIcon, DollarIcon, ListIcon } from './components/ui/DashboardIcons';
import { CommandPalette } from './components/ui/CommandPalette';
import { GlobalActivityToaster } from './components/GlobalActivityToaster';
import { ProfileCard } from './components/ProfileCard';
import { downloadFileFromLink } from './utils/secureDownload';
import './components/AnalyticsDashboard.css';
import './components/SaaSMetricsDashboard.css';
import './styles/global.css';

/**
 * App Component - Main application routing and layout
 * Integrates authentication, session management, and Salesforce OAuth
 * Day 3: Salesforce OAuth integration with opportunities management
 * Day 6: Analytics dashboard, advanced search/export, bulk operations UI,
 * and real-time notifications
 */

function App() {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const [showSalesforceModal, setShowSalesforceModal] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Global Ctrl+K / Cmd+K to open the command palette - only registered
  // while authenticated, so it does nothing on the login/signup pages.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const handleKeyDown = (e) => {
      const modifierPressed = navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey;
      if (modifierPressed && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

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
      {isAuthenticated && (
        <Navbar
          onSalesforceClick={() => setShowSalesforceModal(true)}
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
        />
      )}

      {isAuthenticated && (
        <>
          <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
          <GlobalActivityToaster />
        </>
      )}

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
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />}
          />
          {/* Reachable whether signed in or not - the token in the link
              proves identity on its own, and a user may open it in a
              different browser/device than they signed up in. */}
          <Route path="/verify-email" element={<VerifyEmail />} />

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

          {/* Leads, Lead Scoring & Contracts */}
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <LeadsBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts"
            element={
              <ProtectedRoute>
                <ContractsView />
              </ProtectedRoute>
            }
          />

          {/* Analytics & Search - Day 6 Features */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saas-metrics"
            element={
              <ProtectedRoute>
                <SaaSMetricsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <AdvancedSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-operations"
            element={
              <ProtectedRoute>
                <BulkOperations />
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
  const toast = useToast();
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

        // pipeline-summary's SOQL only aggregates open deals (WHERE IsClosed
        // = false - see data.controller.js), so it can never contain a
        // 'Closed Won' stage to look up; count closed-won deals from the
        // opportunities list instead, which has StageName per record (though
        // that list is capped at 100 records, unlike the exact aggregate).
        const closedWonCount = opportunities.filter((opp) => opp.StageName === 'Closed Won').length;

        setStats({
          activeDeals: pipeline?.totalOpportunities ?? 0,
          closedWon: closedWonCount,
          pipelineValue: pipeline?.totalPipelineValue ?? 0,
          // The opportunities fetch is capped at 100 records (see
          // getSalesforceOpportunities), so this reflects "how many are
          // available to browse" via the link below, not an exact org-wide
          // total the way activeDeals/pipelineValue are.
          totalFetched: opportunities.length,
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

  const opportunityCount = stats?.totalFetched ?? 0;

  const handleExportStats = async (format) => {
    try {
      // GET /data/export/:format now returns a secure, single-use, 1-hour
      // download link rather than the file itself (see
      // data.controller.js's exportDashboardStats) - redeem it immediately
      // so the user experience is still one click.
      const linkResponse = await api.get(`/data/export/${format}`);
      await downloadFileFromLink(linkResponse.data.data);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export dashboard stats');
    }
  };

  return (
    <div className="container">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          color: 'white'
        }}
      >
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>Sales Pipeline Intelligence</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Welcome back, {user?.name || 'User'}!</p>
      </motion.div>

      {/* Salesforce Connection Status - Day 3 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        style={{
          background: salesforceConnected ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${salesforceConnected ? '#10b981' : '#ef4444'}`,
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}
      >
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
            <motion.button
              onClick={onSalesforceConnect}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
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
            >
              Connect Salesforce
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Dashboard Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Dashboard Stats</h2>
        {salesforceConnected && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleExportStats('csv')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              📥 Export CSV
            </button>
            <button
              onClick={() => handleExportStats('pdf')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              📥 Export PDF
            </button>
          </div>
        )}
      </div>
      <motion.div
        className="report-metrics"
        variants={gridVariants}
        initial="hidden"
        animate="show"
        style={{ marginBottom: '2rem' }}
      >
        <MetricCard
          label="Active Deals"
          icon={BriefcaseIcon}
          tone="purple"
          numericValue={salesforceConnected ? stats?.activeDeals ?? 0 : 0}
          format={(n) => Math.round(n)}
          footer={salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : 'Open deals') : 'Connect Salesforce to view'}
        />

        <MetricCard
          label="Closed Won"
          icon={CheckCircleIcon}
          tone="green"
          numericValue={salesforceConnected ? stats?.closedWon ?? 0 : 0}
          format={(n) => Math.round(n)}
          footer={salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : 'Deals won') : 'Connect Salesforce to view'}
        />

        <MetricCard
          label="Pipeline Value"
          icon={DollarIcon}
          tone="red"
          numericValue={salesforceConnected ? stats?.pipelineValue ?? 0 : 0}
          format={(n) => `$${Math.round(n).toLocaleString()}`}
          footer={salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : 'Open pipeline') : 'Connect Salesforce to view'}
        />

        <MetricCard
          label="Opportunities"
          icon={ListIcon}
          tone="indigo"
          numericValue={salesforceConnected ? opportunityCount : 0}
          format={(n) => Math.round(n)}
          footer={
            salesforceConnected ? (
              statsLoading ? (
                'Loading from Salesforce...'
              ) : (
                <Link to="/opportunities">View all opportunities →</Link>
              )
            ) : (
              'Connect Salesforce to view'
            )
          }
        />
      </motion.div>

      {/* Profile Information */}
      <h2 style={{ margin: 0, marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
        Profile Information
      </h2>
      <ProfileCard user={user} onConnectSalesforce={!salesforceConnected ? onSalesforceConnect : undefined} />
    </div>
  );
}

export default App;
