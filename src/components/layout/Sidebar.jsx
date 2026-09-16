import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Logo } from '../ui/Logo';
import {
  HomeIcon,
  ChevronLeftIcon,
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
} from '../ui/DashboardIcons';
import { canManageSalesforceRecords } from '../../utils/permissions';
import './Sidebar.css';

const COLLAPSE_STORAGE_KEY = 'sidebar-collapsed';

/**
 * Sidebar - primary app navigation, replacing the old Navbar "Dashboard +
 * More dropdown" pattern with a persistent left rail (the standard
 * professional-SaaS layout). Navbar.jsx keeps only the topbar utilities
 * (search, theme, notifications, Salesforce status, user menu); this owns
 * every route link.
 *
 * Two independent open/closed concepts:
 * - Collapse (desktop): icon-only rail vs full width, toggled by the user
 *   and remembered in localStorage, same pattern as ThemeProvider's theme
 *   preference.
 * - Mobile drawer: off-canvas below the 1024px breakpoint (matching the
 *   breakpoint Navbar already used for its old hamburger/desktop-nav
 *   split), controlled by the parent (App.jsx) since the hamburger button
 *   that opens it lives in Navbar, not here.
 */
export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // private browsing / storage disabled - collapse state just won't persist
      }
      return next;
    });
  }, []);

  const handleNavigate = useCallback((path) => {
    navigate(path);
    onCloseMobile?.();
  }, [navigate, onCloseMobile]);

  const isActive = (path) => location.pathname === path;

  // The persisted collapse preference is desktop-only - the mobile drawer
  // (isMobileOpen) is always full width, so it must never render icon-only
  // just because the desktop rail happens to be collapsed right now.
  const displayCollapsed = isCollapsed && !isMobileOpen;

  // Same grouping/order as the Navbar "More" menu it replaces - mirrors the
  // actual sales process and the underlying Salesforce data relationships:
  //   Lead (unqualified prospect)
  //     -> converts into -> Account (the company) + Contact (people there)
  //     -> Opportunity (the deal being pursued at that Account)
  //     -> Quote (a priced proposal for that Opportunity)
  //     -> Contract (the signed agreement once the deal is won)
  // Insights and Tools come after the operational stages; Admin (Bulk
  // Operations mutates Salesforce data at scale, restricted server-side to
  // manager/admin - see salesforce.routes.js) is last and role-gated.
  const groups = user?.isSalesforceConnected
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

  return (
    <>
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`sidebar ${displayCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-brand">
          <button
            className="sidebar-logo"
            onClick={() => handleNavigate('/')}
            aria-label="Sales Pipeline Intelligence Home"
          >
            <Logo size={26} showText={false} />
            {!displayCollapsed && <span className="sidebar-brand-text">Sales Pipeline</span>}
          </button>
          {!isMobileOpen && (
            <button
              className="sidebar-collapse-toggle"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeftIcon
                width={16}
                height={16}
                style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}
              />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigate('/')}
            title={displayCollapsed ? 'Dashboard' : undefined}
          >
            <HomeIcon width={18} height={18} />
            {!displayCollapsed && <span>Dashboard</span>}
          </button>

          {groups.map((group) => (
            <div className="sidebar-group" key={group.label}>
              {!displayCollapsed && <div className="sidebar-group-label">{group.label}</div>}
              {group.links.map((link) => (
                <button
                  key={link.path}
                  className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => handleNavigate(link.path)}
                  title={displayCollapsed ? link.label : undefined}
                >
                  <link.icon width={18} height={18} />
                  {!displayCollapsed && <span>{link.label}</span>}
                </button>
              ))}
            </div>
          ))}

          {groups.length === 0 && !displayCollapsed && (
            <p className="sidebar-empty-hint">Connect Salesforce to see your pipeline here.</p>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
