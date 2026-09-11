import { useState, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

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
export const Navbar = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleNavigation = useCallback((path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [navigate]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
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
              <button
                className="navbar-link"
                onClick={() => handleNavigation('/pipeline')}
              >
                Pipeline
              </button>
              <button
                className="navbar-link"
                onClick={() => handleNavigation('/analytics')}
              >
                Analytics
              </button>
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
                    👤 Profile
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => handleNavigation('/settings')}
                    role="menuitem"
                  >
                    ⚙️ Settings
                  </button>

                  {user?.salesforceUserId && (
                    <button
                      className="dropdown-item salesforce-connected"
                      role="menuitem"
                      disabled
                    >
                      ✓ Salesforce Connected
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