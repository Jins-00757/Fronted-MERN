
import { useEffect, useState, useCallback, useRef } from 'react';

// Same API origin axios talks to (see services/api.js), just swapped to the
// ws(s): scheme and without the /api suffix.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const WS_URL = API_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws';

const DEFAULT_EVENT_TYPES = [
  'opportunity.created',
  'opportunity.updated',
  'opportunity.closed',
  // Pushed by notifyStageChange()/sendDailySummaries() when an email
  // notification fails to send (see opportunitiesController.js /
  // schedulerService.js) - previously only a server-side console.error, so
  // a bad address or SMTP outage was invisible until an external bounce
  // showed up in the user's inbox, if ever.
  'notification.email_failed',
  // Pushed by the inbound Salesforce webhook when an Opportunity a quote
  // was sent for is closed directly in Salesforce (see Backend-MERN's
  // webhookController.js) - see DealWonCelebration.jsx for the dedicated
  // celebratory toast this also drives.
  'deal.won',
  'deal.lost',
  // Pushed to a rep's manager when they submit a discount-justification note
  // for approval (see Backend-MERN's quotesController.submitDiscountJustification,
  // triggered from QuoteBuilder.jsx). NotificationCenter.jsx's default icon
  // case already renders any unrecognized type generically, so no per-type
  // icon is required for this to show up correctly.
  'quote.discount_justification',
];

/**
 * useNotifications - Live in-app notifications over WebSocket.
 *
 * Authenticated the same way as every other request in this app: the
 * httpOnly `token` cookie set by login/signup. The browser attaches that
 * cookie to the WebSocket handshake automatically (it's a same-site request,
 * see middleware/websocket.js on the backend) - there is no token for this
 * hook to read or pass along.
 *
 * @param {string[]} eventTypes - event types to subscribe to on connect.
 *   Defaults to the 3 events NotificationCenter renders as toasts; the Deal
 *   Activity Feed (ActivityFeed.jsx) passes a 4th ('opportunity.deleted')
 *   since it needs the full CRUD history, not just create/update/close.
 *   Only the value passed on the *first* render is used (see eventTypesRef
 *   below) - the subscription list is fixed for the lifetime of the socket,
 *   same as WS_URL.
 */
export const useNotifications = (eventTypes = DEFAULT_EVENT_TYPES) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const eventTypesRef = useRef(eventTypes);

  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    wsRef.current = websocket;

    websocket.onopen = () => {
      setIsConnected(true);
      eventTypesRef.current.forEach(
        (eventType) => websocket.send(JSON.stringify({ type: 'subscribe', eventType }))
      );
    };

    websocket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    };

    websocket.onclose = () => {
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      websocket.close();
      wsRef.current = null;
    };
  }, []);

  const subscribe = useCallback((eventType) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'subscribe', eventType }));
    }
  }, []);

  const unsubscribe = useCallback((eventType) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe', eventType }));
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    isConnected,
    subscribe,
    unsubscribe,
    clearNotifications,
  };
};
