import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import {
  UsersIcon,
  BuildingIcon,
  PhoneIcon,
  BriefcaseIcon,
  ListIcon,
  FileTextIcon,
  InfoIcon,
} from './ui/DashboardIcons';
import './ActivityFeed.css';

// Activity Feed - slide-over panel showing real-time CRUD history across
// every CRM object the app writes to (Leads, Accounts, Contacts,
// Opportunities, Contracts, Quotes), not just Opportunities. Combines a
// REST history page (AuditLog entries fetched on open, see
// activityController.getActivity on the backend) with live WebSocket
// events (see useNotifications) so the panel is both populated immediately
// and stays current without a refresh.
//
// Mirrors backend activityController.ACTIVITY_RESOURCE_TYPES x
// create/update/delete, plus the handful of domain-specific event names
// that don't fit that plain pattern (opportunity.closed, lead.converted,
// lead.bulk_converted) - keep both lists in sync if a new object type or
// action is added on the backend.
const ACTIVITY_EVENT_TYPES = [
  'lead.created', 'lead.updated', 'lead.deleted', 'lead.converted', 'lead.bulk_converted',
  'account.created', 'account.updated',
  'contact.created', 'contact.updated',
  'opportunity.created', 'opportunity.updated', 'opportunity.closed', 'opportunity.deleted',
  'contract.created', 'contract.updated',
  'quote.created', 'quote.updated', 'quote.deleted',
];

// Same icon-per-object-type choices as Sidebar.jsx's nav links, so an
// object reads the same way wherever it appears in the app.
const RESOURCE_ICON = {
  lead: UsersIcon,
  account: BuildingIcon,
  contact: PhoneIcon,
  opportunity: BriefcaseIcon,
  contract: ListIcon,
  quote: FileTextIcon,
};

const IconForEventType = ({ eventType }) => {
  const [resource] = (eventType || '').split('.');
  const Icon = RESOURCE_ICON[resource] || InfoIcon;
  return <Icon width={16} height={16} />;
};

// Normalize a persisted AuditLog entry into the same {type, timestamp, data}
// shape a live WebSocket event arrives in. eventType/title/message are
// persisted directly by every controller's recordActivity() helper (see
// AuditLogger.log), so this is a plain field mapping - no per-entity
// reconstruction needed. A row from before that was added falls back to a
// generic "<Resource> <action>" description instead of guessing at fields
// a given entity's `changes` object may or may not have.
const fromAuditLog = (log) => {
  const action = (log.action || '').toLowerCase();
  const type = log.eventType || `${(log.resourceType || 'record').toLowerCase()}.${action}d`;

  return {
    type,
    timestamp: log.timestamp,
    data: {
      title: log.title || `${log.resourceType || 'Record'} ${action}d`,
      message: log.message || log.resourceId,
      resourceId: log.resourceId,
      changes: log.changes,
    },
  };
};

export const ActivityFeed = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { notifications: liveEvents, isConnected } = useNotifications(ACTIVITY_EVENT_TYPES);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-open loading flag, not derivable from props/state
    setLoading(true);
    setError(null);

    api
      .get('/salesforce/activity', { params: { limit: 30 } })
      .then((response) => {
        if (!cancelled) setHistory(response.data.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load activity');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Live events are always newer than the history page fetched on open, so
  // they're simply prepended - deduped against history by resourceId+
  // timestamp so a change made just before/during the fetch doesn't render
  // twice.
  const combined = useMemo(() => {
    const liveKeys = new Set(liveEvents.map((e) => `${e.data?.resourceId}-${e.timestamp}`));

    const historyItems = history
      .map(fromAuditLog)
      .filter((item) => !liveKeys.has(`${item.data.resourceId}-${item.timestamp}`));

    return [...liveEvents, ...historyItems].slice(0, 50);
  }, [liveEvents, history]);

  if (!isOpen) return null;

  return (
    <div className="activity-feed-overlay" onClick={onClose}>
      <div
        className="activity-feed-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Activity feed"
      >
        <div className="activity-feed-header">
          <h3>
            Activity
            {isConnected && <span className="live-dot" title="Live" />}
          </h3>
          <button className="btn-small" onClick={onClose} aria-label="Close activity feed">
            ✕
          </button>
        </div>

        <div className="activity-feed-body">
          {loading && <div className="activity-empty">Loading activity...</div>}
          {!loading && error && <div className="activity-empty">{error}</div>}
          {!loading && !error && combined.length === 0 && (
            <div className="activity-empty">No activity yet</div>
          )}
          {!loading &&
            !error &&
            combined.map((item, i) => <ActivityItem key={`${item.timestamp}-${i}`} item={item} />)}
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ item }) => (
  <div className="activity-item">
    <div className="activity-icon"><IconForEventType eventType={item.type} /></div>
    <div className="activity-content">
      <div className="activity-title">{item.data?.title}</div>
      <div className="activity-message">{item.data?.message}</div>
      <div className="activity-time">{new Date(item.timestamp).toLocaleString()}</div>
    </div>
  </div>
);

export default ActivityFeed;
