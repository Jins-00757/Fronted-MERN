import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import './ActivityFeed.css';

// Deal Activity Feed - side panel showing the CRUD history for the user's
// opportunities. Combines a REST history page (AuditLog entries fetched on
// open) with live WebSocket events (see useNotifications) so the panel is
// both populated immediately and stays current without a refresh.
const ACTIVITY_EVENT_TYPES = [
  'opportunity.created',
  'opportunity.updated',
  'opportunity.closed',
  'opportunity.deleted',
];

const ACTION_META = {
  'opportunity.created': { icon: '✨', label: 'created' },
  'opportunity.updated': { icon: '📝', label: 'updated' },
  'opportunity.closed': { icon: '🎉', label: 'closed' },
  'opportunity.deleted': { icon: '🗑️', label: 'deleted' },
};

// Opportunity closes are logged as a plain 'UPDATE' AuditLog action (see
// opportunitiesController.closeOpportunity) - IsClosed in the stored changes
// is what distinguishes a close from a regular field edit, matched below
// before falling back to the generic UPDATE/CREATE/DELETE mapping.
const eventTypeForLog = (log) => {
  if (log.action === 'UPDATE' && log.changes?.IsClosed) return 'opportunity.closed';
  if (log.action === 'CREATE') return 'opportunity.created';
  if (log.action === 'DELETE') return 'opportunity.deleted';
  return 'opportunity.updated';
};

const titleForLog = (log, eventType) => {
  if (eventType === 'opportunity.closed') {
    return `Opportunity closed as ${log.changes?.IsWon ? 'Won' : 'Lost'}`;
  }
  if (eventType === 'opportunity.updated' && log.changes?.previousStage) {
    return `Stage changed: ${log.changes.previousStage} → ${log.changes.StageName}`;
  }
  return `Opportunity ${eventType.replace('opportunity.', '')}`;
};

// Normalize a stored AuditLog entry (GET /salesforce/opportunities/activity)
// into the same {type, timestamp, data} shape a live WebSocket event arrives
// in, so both render through the one <ActivityItem>.
const fromAuditLog = (log) => {
  const type = eventTypeForLog(log);
  return {
    type,
    timestamp: log.timestamp,
    data: {
      title: titleForLog(log, type),
      message: log.changes?.dealName || log.resourceId,
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
      .get('/salesforce/opportunities/activity', { params: { limit: 30 } })
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
  // they're simply prepended - deduped against history by resourceId so a
  // change made just before/during the fetch doesn't render twice.
  const combined = useMemo(() => {
    const liveResourceIds = new Set(
      liveEvents.map((e) => `${e.data?.resourceId}-${e.timestamp}`)
    );

    const historyItems = history
      .map(fromAuditLog)
      .filter((item) => !liveResourceIds.has(`${item.data.resourceId}-${item.timestamp}`));

    return [...liveEvents, ...historyItems].slice(0, 50);
  }, [liveEvents, history]);

  if (!isOpen) return null;

  return (
    <div className="activity-feed-overlay" onClick={onClose}>
      <div
        className="activity-feed-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Deal activity feed"
      >
        <div className="activity-feed-header">
          <h3>
            Deal Activity
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

const ActivityItem = ({ item }) => {
  const meta = ACTION_META[item.type] || { icon: 'ℹ️', label: 'changed' };

  return (
    <div className="activity-item">
      <div className="activity-icon">{meta.icon}</div>
      <div className="activity-content">
        <div className="activity-title">{item.data?.title}</div>
        <div className="activity-message">{item.data?.message}</div>
        <div className="activity-time">{new Date(item.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default ActivityFeed;
