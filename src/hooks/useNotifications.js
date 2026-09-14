
import { useEffect, useState, useCallback, useRef } from 'react';

// Same API origin axios talks to (see services/api.js), just swapped to the
// ws(s): scheme and without the /api suffix.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const WS_URL = API_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '') + '/ws';

/**
 * useNotifications - Live in-app notifications over WebSocket.
 *
 * Authenticated the same way as every other request in this app: the
 * httpOnly `token` cookie set by login/signup. The browser attaches that
 * cookie to the WebSocket handshake automatically (it's a same-site request,
 * see middleware/websocket.js on the backend) - there is no token for this
 * hook to read or pass along.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    wsRef.current = websocket;

    websocket.onopen = () => {
      setIsConnected(true);
      ['opportunity.created', 'opportunity.updated', 'opportunity.closed'].forEach(
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
