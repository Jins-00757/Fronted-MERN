import { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../context/useToast';
import { wasRecentSelfAction } from '../utils/recentSelfActions';

// All four opportunity mutation events - a superset of what NotificationCenter
// (created/updated/closed only) subscribes to, so deletions surface here too.
const ACTIVITY_EVENT_TYPES = [
  'opportunity.created',
  'opportunity.updated',
  'opportunity.closed',
  'opportunity.deleted',
];

const TOAST_TYPE = {
  'opportunity.created': 'success',
  'opportunity.updated': 'info',
  'opportunity.closed': 'success',
  'opportunity.deleted': 'warning',
};

/**
 * GlobalActivityToaster - mounted once, app-wide, while authenticated (see
 * App.jsx). Turns every opportunity WebSocket event into a toast, so a
 * change made in one browser tab (or by the daily/stage-change email flows
 * triggering a save elsewhere) shows up live in every other tab - not just
 * inside the Deal Activity Feed panel, which only reflects it when opened.
 *
 * The tab that actually caused a change already gets an immediate toast
 * from its own mutation handler (see OpportunitiesList.jsx/
 * OpportunitiesBoard.jsx's markSelfAction calls) - this component skips
 * those via wasRecentSelfAction so the same change is never announced
 * twice in the tab that made it, while still announcing it in every other
 * tab (which never marked it).
 */
export const GlobalActivityToaster = () => {
  const { notifications } = useNotifications(ACTIVITY_EVENT_TYPES);
  const toast = useToast();
  const lastHandledKeyRef = useRef(null);

  useEffect(() => {
    if (notifications.length === 0) return;

    const latest = notifications[0];
    const key = `${latest.timestamp}-${latest.data?.resourceId}-${latest.type}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    if (wasRecentSelfAction(latest.data?.resourceId, latest.data?.changes?.dealName)) {
      return;
    }

    toast.showToast(latest.data?.message || 'An opportunity changed', {
      type: TOAST_TYPE[latest.type] || 'info',
      title: latest.data?.title,
    });
    // toast intentionally omitted - showToast/dismiss are stable (useCallback
    // in ToastProvider), including it would just be a no-op dependency churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return null;
};

export default GlobalActivityToaster;
