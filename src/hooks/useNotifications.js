
import { useEffect, useState, useCallback } from 'react';

export const useNotifications = (token) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}?token=${token}`;

    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      setIsConnected(true);
      // Subscribe to relevant events
      websocket.send(
        JSON.stringify({
          type: 'subscribe',
          eventType: 'opportunity.created',
        })
      );
      websocket.send(
        JSON.stringify({
          type: 'subscribe',
          eventType: 'opportunity.updated',
        })
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

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [token]);

  const subscribe = useCallback(
    (eventType) => {
      if (ws && isConnected) {
        ws.send(JSON.stringify({ type: 'subscribe', eventType }));
      }
    },
    [ws, isConnected]
  );

  const unsubscribe = useCallback(
    (eventType) => {
      if (ws && isConnected) {
        ws.send(JSON.stringify({ type: 'unsubscribe', eventType }));
      }
    },
    [ws, isConnected]
  );

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