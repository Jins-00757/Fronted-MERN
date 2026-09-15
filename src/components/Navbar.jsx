import { useState, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { Logo } from './ui/Logo';
import { SunIcon, MoonIcon } from './ui/ThemeIcons';
import {
  SearchIcon,
  UsersIcon,
  BriefcaseIcon,
  ListIcon,
  MapPinIcon,
  TrendingUpIcon,
  LayersIcon,
  GridIcon,
} from './ui/DashboardIcons';
import { canManageSalesforceRecords } from '../utils/permissions';
import './Navbar.css';

// Settings toggle for the "send when deal stage changes" / daily summary
// emails (see emailService.js on the backend) - both respect this same
// preferences.notifications.email flag, defaulting to enabled (opt-out) so
// an unset flag (every pre-existing user) reads as "on".
const EmailNotificationsToggle = () => {
  const { user, updatePreferences } = useAuth();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const emailEnabled = user?.preferences?.notifications?.email !== false;

  const handleToggle = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    const next = !emailEnabled;
    const result = await updatePreferences({ notifications: { email: next } });
    setIsSaving(false);
    if (result.success) {
      toast.success(next ? 'Email notifications turned on' : 'Email notifications turned off');
    } else {
      toast.error(result.error || 'Failed to update notification settings');
    }
  }, [isSaving, emailEnabled, updatePreferences, toast]);

  return (
    <div className="dropdown-item dropdown-toggle-item">
      <span>📧 Email notifications</span>
      <button
        type="button"
        role="switch"
        aria-checked={emailEnabled}
        aria-label="Toggle email notifications"
        className={`switch ${emailEnabled ? 'on' : ''}`}
        onClick={handleToggle}
        disabled={isSaving}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
};

// Shown in the dropdown only while user.isEmailVerified is false - lets the
// user re-trigger POST /auth/verify-email/resend (e.g. after fixing a
// typo'd address, or because the original link expired) without leaving
// the page.
const VerifyEmailReminder = () => {
  const { resendVerificationEmail } = useAuth();
  const toast = useToast();
  const [isSending, setIsSending] = useState(false);

  const handleResend = useCallback(async () => {
    if (isSending) return;
    setIsSending(true);
    const result = await resendVerificationEmail();
    setIsSending(false);
    if (result.success) {
      toast.success(result.message || 'Verification email sent');
    } else {
      toast.error(result.error || 'Failed to send verification email');
    }
  }, [isSending, resendVerificationEmail, toast]);

  return (
    <div className="dropdown-item dropdown-verify-item">
      <span>✉️ Email not verified</span>
      <button
        type="button"
        className="dropdown-verify-btn"
        onClick={handleResend}
        disabled={isSending}
      >
        {isSending ? 'Sending...' : 'Resend'}
      </button>
    </div>
  );
};

// NotificationCenter owns its own useNotifications() WebSocket connection,
// so it's only mounted while the dropdown is open - mounting it eagerly (or
// calling useNotifications() again here for a badge count) would open a
// second, redundant socket per page load.

/**
 * Navbar Component - Professional Navigation with Authentication State
 *
 * Features:
 * - Responsive mobile/desktop navigation
 * - User profile dropdown menu
 * - Authentication status display
 * - Smooth transitions and hover effects
 * - Accessibility compliant (ARIA labels, keyboard navigation)
 */
export const Navbar = ({ onSalesforceClick, onOpenCommandPalette }) => {
  const { isAuthenticated, user, logout, isLoading, disconnectSalesforce } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Grouped and ordered to mirror the actual sales process rather than
  // alphabetically/by when each feature happened to ship: a lead moves
  // through Leads -> Opportunities -> Contracts, with Map alongside them as
  // a territory/account view over that same pipeline data. Insights (report
  // on the pipeline) and Tools (cross-cutting utilities) come after the
  // operational stages, and Admin - Bulk Operations mutates Salesforce data
  // at scale and is restricted to manager/admin on the backend (see
  // salesforce.routes.js) - is last and only shown to roles that can
  // actually use it.
  const moreLinkGroups = user?.isSalesforceConnected
    ? [
        {
          label: 'Pipeline',
          links: [
            { path: '/leads', label: 'Leads', icon: UsersIcon },
            { path: '/opportunities', label: 'Opportunities', icon: BriefcaseIcon },
            { path: '/contracts', label: 'Contracts', icon: ListIcon },
            { path: '/map', label: 'Map', icon: MapPinIcon },
          ],
        },
        {
          label: 'Insights',
          links: [
            { path: '/analytics', label: 'Analytics', icon: TrendingUpIcon },
            { path: '/saas-metrics', label: 'SaaS Metrics', icon: LayersIcon },
          ],
        },
        {
          label: 'Tools',
          links: [{ path: '/search', label: 'Search', icon: SearchIcon }],
        },
        ...(canManageSalesforceRecords(user)
          ? [
              {
                label: 'Admin',
                links: [{ path: '/bulk-operations', label: 'Bulk Operations', icon: GridIcon }],
              },
            ]
          : []),
      ]
    : [];

  // Flat form for callers that just need "is there anything to show" or a
  // plain list (the mobile hamburger menu keeps a single flat list rather
  // than repeating desktop's section labels, to stay compact on a phone).
  const moreLinks = moreLinkGroups.flatMap((group) => group.links);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, navigate]);

  const handleDisconnectSalesforce = useCallback(async () => {
    setIsDropdownOpen(false);
    await disconnectSalesforce();
  }, [disconnectSalesforce]);

  const handleNavigation = useCallback((path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setIsMoreMenuOpen(false);
  }, [navigate]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  const toggleMoreMenu = useCallback(() => {
    setIsMoreMenuOpen(prev => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen(prev => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand">
          <button
            className="navbar-logo"
            onClick={() => handleNavigation('/')}
            aria-label="Sales Pipeline Intelligence Home"
          >
            <Logo size={30} />
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="navbar-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="toggle-icon"></span>
          <span className="toggle-icon"></span>
          <span className="toggle-icon"></span>
        </button>

        {/* Navigation Items - Desktop: Dashboard + "More" dropdown */}
        {isAuthenticated && (
          <div className="navbar-menu-desktop">
            <button
              className="navbar-link"
              onClick={() => handleNavigation('/')}
            >
              Dashboard
            </button>

            {moreLinks.length > 0 && (
              <div className="more-menu-container">
                <button
                  className="navbar-link more-menu-toggle"
                  onClick={toggleMoreMenu}
                  aria-label="More navigation options"
                  aria-expanded={isMoreMenuOpen}
                  aria-haspopup="menu"
                >
                  More
                  <span className={`dropdown-arrow ${isMoreMenuOpen ? 'open' : ''}`}>▼</span>
                </button>

                {isMoreMenuOpen && (
                  <div className="more-menu" role="menu">
                    {moreLinkGroups.map((group, groupIndex) => (
                      <div key={group.label}>
                        {groupIndex > 0 && <div className="dropdown-divider" />}
                        <div className="dropdown-section-label">{group.label}</div>
                        {group.links.map((link) => (
                          <button
                            key={link.path}
                            className="dropdown-item"
                            role="menuitem"
                            onClick={() => handleNavigation(link.path)}
                          >
                            <link.icon width={16} height={16} />
                            {link.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Items - Mobile: flat list inside the hamburger overlay */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {isAuthenticated && (
            <>
              <button
                className="navbar-link"
                onClick={() => handleNavigation('/')}
              >
                Dashboard
              </button>
              {moreLinks.map((link) => (
                <button
                  key={link.path}
                  className="navbar-link navbar-link-icon"
                  onClick={() => handleNavigation(link.path)}
                >
                  <link.icon width={16} height={16} />
                  {link.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Right Side - Auth Section */}
        <div className="navbar-auth">
          {isLoading ? (
            <span className="auth-loading">Loading...</span>
          ) : isAuthenticated ? (
            <div className="user-profile-container">
              <button
                className="btn-link cmdk-trigger-btn"
                onClick={onOpenCommandPalette}
                aria-label="Open command palette"
                title="Search & navigate (Ctrl+K)"
              >
                <SearchIcon width={17} height={17} />
              </button>
              <button
                className="btn-link theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>
              <div className="notification-bell-container">
                <button
                  className="btn-link notification-bell-toggle"
                  onClick={toggleNotifications}
                  aria-label="Notifications"
                  aria-expanded={isNotificationsOpen}
                  aria-haspopup="true"
                >
                  🔔
                </button>
                {isNotificationsOpen && (
                  <div className="notification-bell-dropdown">
                    <NotificationCenter />
                  </div>
                )}
              </div>
              {user?.isSalesforceConnected ? (
                <span className="salesforce-badge" title={user?.salesforceOrgName || 'Salesforce'}>
                  ✓ Salesforce
                </span>
              ) : (
                <button className="btn-link" onClick={onSalesforceClick}>
                  🔗 Connect Salesforce
                </button>
              )}
              <button
                className="user-profile-button"
                onClick={toggleDropdown}
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
              >
                <span className="user-avatar">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
                <span className="user-email">{user?.email}</span>
                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="dropdown-menu" role="menu">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user?.name}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={() => handleNavigation('/profile')}
                    role="menuitem"
                  >
                    👤 My Profile
                  </button>

                  <div className="dropdown-divider"></div>

                  {!user?.isEmailVerified && (
                    <>
                      <VerifyEmailReminder />
                      <div className="dropdown-divider"></div>
                    </>
                  )}

                  <EmailNotificationsToggle />

                  <div className="dropdown-divider"></div>

                  {user?.isSalesforceConnected ? (
                    <button
                      className="dropdown-item"
                      onClick={handleDisconnectSalesforce}
                      role="menuitem"
                    >
                      🔌 Disconnect Salesforce
                    </button>
                  ) : (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSalesforceClick?.();
                      }}
                      role="menuitem"
                    >
                      🔗 Connect Salesforce
                    </button>
                  )}

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                className="btn-link"
                onClick={() => handleNavigation('/login')}
              >
                Login
              </button>
              <button
                className="btn-primary"
                onClick={() => handleNavigation('/signup')}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};