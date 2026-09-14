import { useState, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import './Navbar.css';

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
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
  }, [navigate]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
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
            <span className="logo-icon">📊</span>
            <span className="logo-text">Sales Pipeline Intelligence</span>
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

        {/* Navigation Items */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          {isAuthenticated && (
            <>
              <button
                className="navbar-link"
                onClick={() => handleNavigation('/')}
              >
                Dashboard
              </button>
              {user?.isSalesforceConnected && (
                <>
                  <button
                    className="navbar-link"
                    onClick={() => handleNavigation('/opportunities')}
                  >
                    Opportunities
                  </button>
                  <button
                    className="navbar-link"
                    onClick={() => handleNavigation('/analytics')}
                  >
                    Analytics
                  </button>
                  <button
                    className="navbar-link"
                    onClick={() => handleNavigation('/search')}
                  >
                    Search
                  </button>
                  <button
                    className="navbar-link"
                    onClick={() => handleNavigation('/bulk-operations')}
                  >
                    Bulk Operations
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Right Side - Auth Section */}
        <div className="navbar-auth">
          {isLoading ? (
            <span className="auth-loading">Loading...</span>
          ) : isAuthenticated ? (
            <div className="user-profile-container">
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