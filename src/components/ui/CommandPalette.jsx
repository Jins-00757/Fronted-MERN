import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { SunIcon, MoonIcon } from './ThemeIcons';
import {
  BriefcaseIcon,
  ListIcon,
  HealthIcon,
  TrendingUpIcon,
  SearchIcon,
  LayersIcon,
  LogoutIcon,
} from './DashboardIcons';
import './CommandPalette.css';

/**
 * Pure client-side navigation + local UI actions - no Salesforce or backend
 * calls of any kind, deliberately. Opening/using the palette can never
 * touch the connected org.
 */
const buildCommands = ({ navigate, toggleTheme, logout, theme, isSalesforceConnected }) => {
  const commands = [
    { id: 'dashboard', label: 'Dashboard', hint: 'Go to', icon: BriefcaseIcon, action: () => navigate('/') },
  ];

  if (isSalesforceConnected) {
    commands.push(
      { id: 'opportunities', label: 'Opportunities', hint: 'Go to', icon: ListIcon, action: () => navigate('/opportunities') },
      { id: 'analytics', label: 'Analytics & Reporting', hint: 'Go to', icon: HealthIcon, action: () => navigate('/analytics') },
      { id: 'saas-metrics', label: 'SaaS Metrics', hint: 'Go to', icon: TrendingUpIcon, action: () => navigate('/saas-metrics') },
      { id: 'search', label: 'Search Opportunities', hint: 'Go to', icon: SearchIcon, action: () => navigate('/search') },
      { id: 'bulk-operations', label: 'Bulk Operations', hint: 'Go to', icon: LayersIcon, action: () => navigate('/bulk-operations') },
    );
  }

  commands.push({
    id: 'theme',
    label: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
    hint: 'Action',
    icon: theme === 'light' ? MoonIcon : SunIcon,
    action: toggleTheme,
  });

  commands.push({
    id: 'logout',
    label: 'Log Out',
    hint: 'Action',
    icon: LogoutIcon,
    // Mirrors Navbar.jsx's handleLogout - logout() only clears auth state,
    // the redirect to /login is this call site's responsibility.
    action: async () => {
      await logout();
      navigate('/login');
    },
  });

  return commands;
};

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(
    () => buildCommands({ navigate, toggleTheme, logout, theme, isSalesforceConnected: user?.isSalesforceConnected }),
    [navigate, toggleTheme, logout, theme, user?.isSalesforceConnected]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the palette's own transient UI state on open, not derivable from props/state
    setQuery('');
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-selecting the first match whenever the filtered list changes, not derivable from props/state
    setActiveIndex(0);
  }, [query]);

  const runCommand = (command) => {
    if (!command) return;
    onClose();
    command.action();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cmdk-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="cmdk-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.16 }}
          >
            <div className="cmdk-input-row">
              <SearchIcon width={16} height={16} className="cmdk-input-icon" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages or actions..."
                className="cmdk-input"
                aria-label="Command palette search"
              />
              <kbd className="cmdk-esc-hint">Esc</kbd>
            </div>

            <div className="cmdk-list" role="listbox">
              {filtered.length === 0 && <div className="cmdk-empty">No matches</div>}
              {filtered.map((command, i) => (
                <button
                  type="button"
                  key={command.id}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`cmdk-item ${i === activeIndex ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => runCommand(command)}
                >
                  <command.icon width={16} height={16} className="cmdk-item-icon" />
                  <span className="cmdk-item-label">{command.label}</span>
                  <span className="cmdk-item-hint">{command.hint}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CommandPalette;
