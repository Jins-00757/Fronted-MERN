import { useState, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { Logo } from './ui/Logo';
import { SunIcon, MoonIcon } from './ui/ThemeIcons';
import './Navbar.css';

// Settings toggle for the "send when deal stage changes" / daily summary
// emails (see emailService.js on the backend) - both respect this same
// preferences.notifications.email flag, defaulting to enabled (opt-out) so
// an unset flag (every pre-existing user) reads as "on".
const EmailNotificationsToggle = () => {
  const { user, updatePreferences } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const emailEnabled = user?.preferences?.notifications?.email !== false;

  const handleToggle = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    const result = await updatePreferences({ notifications: { email: !emailEnabled } });
    setIsSaving(false);
    if (!result.success) {
      alert(result.error || 'Failed to update notification settings');
    }
  }, [isSaving, emailEnabled, updatePreferences]);

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
export const Navbar = ({ onSalesforceClick }) => {
  const { isAuthenticated, user, logout, isLoading, disconnectSalesforce } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const moreLinks = user?.isSalesforceConnected
    ? [
        { path: '/opportunities', label: 'Opportunities' },
        { path: '/analytics', label: 'Analytics' },
        { path: '/saas-metrics', label: 'SaaS Metrics' },
        { path: '/search', label: 'Search' },
        { path: '/bulk-operations', label: 'Bulk Operations' },
      ]
    : [];

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
                    {moreLinks.map((link) => (
                      <button
                        key={link.path}
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => handleNavigation(link.path)}
                      >
                        {link.label}
                      </button>
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
                  className="navbar-link"
                  onClick={() => handleNavigation(link.path)}
                >
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