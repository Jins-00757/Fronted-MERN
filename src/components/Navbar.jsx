import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '../hooks/useNotifications';
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
  BuildingIcon,
  PhoneIcon,
  FileTextIcon,
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

// The WebSocket connection lives here (not inside NotificationCenter) and
// stays open for as long as the Navbar is mounted - i.e. for as long as the
// user is authenticated - rather than only while the dropdown is open, so
// the unread badge can count notifications that arrive while it's closed.
// NotificationCenter is now a plain display component fed via props, so
// there's still only one socket for the bell (GlobalActivityToaster keeps
// its own separate one for cross-tab toasts - see that file's docstring).

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

  const { notifications, isConnected, clearNotifications } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  // Timestamp of the last time the dropdown was opened - notifications
  // newer than this count as unread. null (never opened yet) means
  // everything received so far is unread.
  const lastReadAtRef = useRef(null);

  useEffect(() => {
    if (isNotificationsOpen) return;
    const lastReadAt = lastReadAtRef.current;
    const unseen = lastReadAt
      ? notifications.filter((n) => new Date(n.timestamp) > new Date(lastReadAt)).length
      : notifications.length;
    setUnreadCount(unseen);
  }, [notifications, isNotificationsOpen]);

  // Grouped and ordered to mirror the actual sales process and the
  // underlying Salesforce data relationships, rather than alphabetically or
  // by when each feature happened to ship:
  //   Lead (unqualified prospect)
  //     -> converts into -> Account (the company) + Contact (people there)
  //     -> Opportunity (the deal being pursued at that Account)
  //     -> Quote (a priced proposal for that Opportunity)
  //     -> Contract (the signed agreement once the deal is won)
  // Account parents both Contact and Opportunity (AccountId on each), and
  // Opportunity parents Quote (OpportunityId) - so Accounts/Contacts come
  // right after Leads and before Opportunities, and Quotes sit between
  // Opportunities and Contracts, matching that parent/child order. Map is
  // last in this group since it's a territory view *over* Accounts rather
  // than a pipeline stage of its own. Insights (report on the pipeline) and
  // Tools (cross-cutting utilities) come after the operational stages, and
  // Admin - Bulk Operations mutates Salesforce data at scale and is
  // restricted to manager/admin on the backend (see salesforce.routes.js) -
  // is last and only shown to roles that can actually use it.
  const moreLinkGroups = user?.isSalesforceConnected
    ? [
        {
          label: 'Pipeline',
          links: [
            { path: '/leads', label: 'Leads', icon: UsersIcon },
            { path: '/accounts', label: 'Accounts', icon: BuildingIcon },
            { path: '/contacts', label: 'Contacts', icon: PhoneIcon },
            { path: '/opportunities', label: 'Opportunities', icon: BriefcaseIcon },
            { path: '/quotes', label: 'Quotes', icon: FileTextIcon },
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
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        // Opening the dropdown is "reading" everything currently in the
        // list - the badge should reset now, and only notifications that
        // arrive after this moment should count toward it next time.
        lastReadAtRef.current = new Date().toISOString();
        setUnreadCount(0);
      }
      return next;
    });
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
                  aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                  aria-expanded={isNotificationsOpen}
                  aria-haspopup="true"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge" aria-hidden="true">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="notification-bell-dropdown">
                    <NotificationCenter
                      notifications={notifications}
                      isConnected={isConnected}
                      clearNotifications={clearNotifications}
                    />
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