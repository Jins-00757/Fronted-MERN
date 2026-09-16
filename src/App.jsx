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
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { SecurityPolicy } from './pages/legal/SecurityPolicy';
import { CookiePolicy } from './pages/legal/CookiePolicy';
import { SalesforceConnect } from './components/salesforce/SalesforceConnect';
import { OpportunitiesList } from './components/salesforce/OpportunitiesList';
import { LeadsBoard } from './components/salesforce/LeadsBoard';
import { ContractsView } from './components/salesforce/ContractsView';
import { AccountsMap } from './components/salesforce/AccountsMap';
import { AccountsView } from './components/salesforce/AccountsView';
import { ContactsView } from './components/salesforce/ContactsView';
import { QuotesView } from './components/salesforce/QuotesView';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SaaSMetricsDashboard } from './components/SaaSMetricsDashboard';
import { AdvancedSearch } from './components/AdvancedSearch';
import BulkOperations from './pages/BulkOperations';
import { Profile } from './pages/Profile';
import api from './services/api';
import { MetricCard } from './components/ui/ReportWidgets';
import { gridVariants } from './components/ui/reportWidgetUtils';
import { BriefcaseIcon, CheckCircleIcon, DollarIcon, ListIcon, UsersIcon, TrendingUpIcon, DownloadIcon, LinkIcon } from './components/ui/DashboardIcons';
import { isElevatedRole } from './utils/permissions';
import { CommandPalette } from './components/ui/CommandPalette';
import { GlobalActivityToaster } from './components/GlobalActivityToaster';
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
  // Mobile-only off-canvas state for Sidebar - the desktop persistent rail
  // has its own separate collapse/expand state, owned inside Sidebar itself.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      {/* Persistent left nav, only for the authenticated app shell - same
          condition as Navbar below, so the two always appear together. */}
      {isAuthenticated && (
        <Sidebar isMobileOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)} />
      )}

      <div className="app-body">
        {/* Only show Navbar when authenticated */}
        {isAuthenticated && (
          <Navbar
            onSalesforceClick={() => setShowSalesforceModal(true)}
            onOpenCommandPalette={() => setIsPaletteOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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

          {/* Legal/compliance pages - linked from the Footer, reachable
              whether signed in or not (unlike ProtectedRoute pages below,
              which redirect a logged-out visitor to /login). */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/security" element={<SecurityPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

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

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile onConnectSalesforce={() => setShowSalesforceModal(true)} />
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

          {/* Accounts, Contacts & the Quotation/Proposal Generator */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <ContactsView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotes"
            element={
              <ProtectedRoute>
                <QuotesView />
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
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <AccountsMap />
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

        {/* Marketing/legal chrome - shown on the logged-out screens (login,
            signup, legal pages) same as before, but hidden once authenticated
            so it doesn't compete with the app's own in-product navigation. */}
        {!isAuthenticated && <Footer />}
      </div>

      {/* Salesforce Connect Modal - Day 3 Feature */}
      {isAuthenticated && showSalesforceModal && (
        <SalesforceConnect
          onClose={() => setShowSalesforceModal(false)}
          isConnected={user?.isSalesforceConnected}
        />
      )}
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
  // Distinguishes "genuinely zero" from "we don't actually know" - without
  // this, a failed fetch (e.g. the connected Salesforce org being down) left
  // `stats` null, which the cards below rendered as a plain 0 with the same
  // caption a real zero would get ("Open deals") - indistinguishable from
  // an account that simply has no deals yet. See the error banner/footer
  // text below for how this is surfaced.
  const [statsError, setStatsError] = useState(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Role-aware dashboard section: manager/admin get a live team summary
  // (their own team for a manager, org-wide by default for admin - see
  // AnalyticsService.resolveTeamOwnerIds), a plain 'user' sees the
  // Dashboard exactly as it looks today with nothing added or removed.
  const showTeamSnapshot = isElevatedRole(user?.role);
  const [teamSnapshot, setTeamSnapshot] = useState(null);
  const [teamSnapshotLoading, setTeamSnapshotLoading] = useState(false);

  useEffect(() => {
    if (!showTeamSnapshot || !salesforceConnected) return undefined;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    setTeamSnapshotLoading(true);

    api.get('/analytics/team-performance')
      .then((res) => {
        if (cancelled || !res.data.success) return;

        const reps = Object.values(res.data.data || {});
        const combinedPipeline = reps.reduce((sum, rep) => sum + (rep.totalValue || 0), 0);
        const topRep = [...reps].sort((a, b) => b.totalValue - a.totalValue)[0];

        setTeamSnapshot({
          repCount: reps.length,
          combinedPipeline,
          topRepName: topRep?.ownerName || null,
        });
      })
      .catch((error) => {
        console.error('Error fetching team snapshot:', error);
        if (!cancelled) setTeamSnapshot(null);
      })
      .finally(() => {
        if (!cancelled) setTeamSnapshotLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showTeamSnapshot, salesforceConnected]);

  useEffect(() => {
    // Nothing to fetch when disconnected - the JSX below only reads `stats`
    // when `salesforceConnected` is true, so stale stats are never shown.
    if (!salesforceConnected) {
      return undefined;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    setStatsLoading(true);
    setStatsError(null);

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
        if (!cancelled) {
          setStats(null);
          setStatsError(error.message || 'Failed to load data from Salesforce');
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [salesforceConnected, statsRefreshKey]);

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
          background: 'linear-gradient(135deg, #157a6e 0%, #499f68 100%)',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          color: 'white'
        }}
      >
        <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>Sales Pipeline Intelligence</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Welcome back, {user?.name || 'User'}!</p>
      </motion.div>

      {/* Salesforce Connection Status - only shown while disconnected; once
          connected, the topbar's "Salesforce" badge already covers this, so
          repeating it here on every dashboard visit is just noise. */}
      {!salesforceConnected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          style={{
            background: '#fef2f2',
            border: '2px solid var(--danger-color)',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{
                margin: 0,
                marginBottom: '0.5rem',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <LinkIcon width={18} height={18} />
                Salesforce Connection
              </h3>
              <p style={{ margin: 0, color: 'var(--danger-color)', fontSize: '0.9rem' }}>
                Not connected
              </p>
            </div>
            <motion.button
              onClick={onSalesforceConnect}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
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
          </div>
        </motion.div>
      )}

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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
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
              <DownloadIcon width={15} height={15} /> Export CSV
            </button>
            <button
              onClick={() => handleExportStats('pdf')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
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
              <DownloadIcon width={15} height={15} /> Export PDF
            </button>
          </div>
        )}
      </div>

      {salesforceConnected && statsError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.85rem 1.1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.88rem',
          }}
        >
          <span>
            <strong>Couldn't load live data from Salesforce.</strong> The numbers below are not shown because
            the request failed, not because your pipeline is empty. {statsError}
          </span>
          <button
            onClick={() => setStatsRefreshKey((k) => k + 1)}
            disabled={statsLoading}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #991b1b',
              background: 'transparent',
              color: '#991b1b',
              cursor: statsLoading ? 'default' : 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              whiteSpace: 'nowrap',
            }}
          >
            {statsLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

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
          numericValue={salesforceConnected && !statsError ? stats?.activeDeals ?? 0 : 0}
          format={(n) => (statsError ? '—' : Math.round(n))}
          footer={salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : statsError ? 'Unable to load' : 'Open deals') : 'Connect Salesforce to view'}
        />

        <MetricCard
          label="Closed Won"
          icon={CheckCircleIcon}
          tone="green"
          numericValue={salesforceConnected && !statsError ? stats?.closedWon ?? 0 : 0}
          format={(n) => (statsError ? '—' : Math.round(n))}
          footer={salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : statsError ? 'Unable to load' : 'Deals won') : 'Connect Salesforce to view'}
        />

        <MetricCard
          label="Pipeline Value"
          icon={DollarIcon}
          tone="red"
          numericValue={salesforceConnected && !statsError ? stats?.pipelineValue ?? 0 : 0}
          format={(n) => (statsError ? '—' : `$${Math.round(n).toLocaleString()}`)}
          footer={salesforceConnected ? (statsLoading ? 'Loading from Salesforce...' : statsError ? 'Unable to load' : 'Open pipeline') : 'Connect Salesforce to view'}
        />

        <MetricCard
          label="Opportunities"
          icon={ListIcon}
          tone="indigo"
          numericValue={salesforceConnected && !statsError ? opportunityCount : 0}
          format={(n) => (statsError ? '—' : Math.round(n))}
          footer={
            salesforceConnected ? (
              statsLoading ? (
                'Loading from Salesforce...'
              ) : statsError ? (
                'Unable to load'
              ) : (
                <Link to="/opportunities">View all opportunities →</Link>
              )
            ) : (
              'Connect Salesforce to view'
            )
          }
        />
      </motion.div>

      {showTeamSnapshot && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Team Snapshot</h2>
            <Link to="/analytics" style={{ fontSize: '0.85rem' }}>View full report →</Link>
          </div>
          {salesforceConnected ? (
            <motion.div
              className="report-metrics"
              variants={gridVariants}
              initial="hidden"
              animate="show"
              style={{ marginBottom: '2rem' }}
            >
              <MetricCard
                label="Reps Tracked"
                icon={UsersIcon}
                tone="indigo"
                numericValue={teamSnapshot?.repCount ?? 0}
                format={(n) => Math.round(n)}
                footer={teamSnapshotLoading ? 'Loading from Salesforce...' : 'On your team'}
              />
              <MetricCard
                label="Combined Pipeline"
                icon={DollarIcon}
                tone="purple"
                numericValue={teamSnapshot?.combinedPipeline ?? 0}
                format={(n) => `$${Math.round(n).toLocaleString()}`}
                footer={teamSnapshotLoading ? 'Loading from Salesforce...' : 'Across the team'}
              />
              <MetricCard
                label="Top Performer"
                icon={TrendingUpIcon}
                tone="green"
                numericValue={0}
                format={() => teamSnapshot?.topRepName || '—'}
                footer={teamSnapshotLoading ? 'Loading from Salesforce...' : 'By pipeline value'}
              />
            </motion.div>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Connect Salesforce to see your team's pipeline.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
