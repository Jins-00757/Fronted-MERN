import { useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from '../context/useToast';
import { emitDealClosed } from '../utils/dealEvents';

// Pushed by the inbound Salesforce webhook (see Backend-MERN's
// webhookController.js) when an Opportunity with a quote this app sent is
// closed directly in Salesforce - not by any action taken inside this app,
// so unlike opportunity.* events there's no "self action" tab to dedupe
// against (see GlobalActivityToaster.jsx): every connected tab for the
// owning rep shows this the same way.
const EVENT_TYPES = ['deal.won', 'deal.lost'];

/**
 * DealWonCelebration - mounted once, app-wide, while authenticated (see
 * App.jsx, next to GlobalActivityToaster). Turns a real-time "Opportunity
 * closed in Salesforce" push into a celebratory toast, and re-broadcasts it
 * on dealEvents so Dashboard/OpportunitiesList/OpportunitiesBoard can
 * live-update their own numbers and stage badges without a page refresh,
 * without each of them opening a second WebSocket connection of their own.
 */
export const DealWonCelebration = () => {
  const { notifications } = useNotifications(EVENT_TYPES);
  const toast = useToast();
  const lastHandledKeyRef = useRef(null);

  useEffect(() => {
    if (notifications.length === 0) return;

    const latest = notifications[0];
    const key = `${latest.timestamp}-${latest.data?.resourceId}-${latest.type}`;
    if (lastHandledKeyRef.current === key) return;
    lastHandledKeyRef.current = key;

    emitDealClosed(latest.data);

    if (latest.type === 'deal.won') {
      toast.showToast(latest.data?.message || 'A deal just closed - won!', {
        type: 'celebration',
        title: latest.data?.title || '🎉 Deal Won!',
        duration: 7000,
      });
    } else {
      toast.warning(latest.data?.message || 'A deal was closed lost', {
        title: latest.data?.title || 'Deal closed lost',
      });
    }
    // toast intentionally omitted - showToast/warning are stable (useCallback
    // in ToastProvider), including it would just be a no-op dependency churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return null;
};

export default DealWonCelebration;
