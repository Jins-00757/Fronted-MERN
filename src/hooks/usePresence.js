
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Same API origin axios/the notifications WebSocket talk to (see
// services/api.js, hooks/useNotifications.js), just without the /api suffix
// - Socket.IO negotiates its own path ('/socket.io') on that same origin.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

/**
 * usePresence - global "who's online" roster over Socket.IO. Authenticated
 * the same way as useNotifications' WebSocket connection: the httpOnly
 * `token` cookie, attached automatically for a same-site connection (see
 * Backend-MERN's realtime/socketServer.js).
 *
 * Deliberately one connection per hook instance, not a shared/reference-
 * counted socket - this mirrors useNotifications.js's existing pattern
 * (Navbar, ActivityFeed, GlobalActivityToaster, and DealWonCelebration each
 * already open their own independent WebSocket), which has held up fine at
 * this app's scale. A shared-connection optimization would trade a small
 * connection-count saving for real shared-lifecycle bugs to get wrong.
 */
export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { path: '/socket.io', withCredentials: true });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('presence:roster', (roster) => setOnlineUsers(roster || []));

    socket.on('presence:online', (user) => {
      setOnlineUsers((prev) => (prev.some((u) => u.userId === user.userId) ? prev : [...prev, user]));
    });

    socket.on('presence:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { onlineUsers, isConnected };
};

/**
 * useRecordPresence - joins a per-record presence room for as long as
 * `resourceId` is truthy (e.g. only while an edit modal for that record is
 * open), leaving it again on unmount or when the id changes. Returns
 * everyone currently viewing that record, including the current user.
 *
 * This is a soft, informational early-warning only ("Jane is also viewing
 * this") - it is NOT what prevents a lost update. The authoritative check
 * happens server-side on save regardless of what presence shows (see
 * Backend-MERN's conflictResolutionService.js) - two people can still both
 * have a record open with no one else visibly "viewing" it if one of them
 * closed the tab without a clean disconnect event yet.
 */
export const useRecordPresence = (resourceType, resourceId) => {
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    if (!resourceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale viewers the instant there's no record to watch, not derived from other state
      setViewers([]);
      return undefined;
    }

    const socket = io(SOCKET_URL, { path: '/socket.io', withCredentials: true });

    const join = () => socket.emit('record:join', { resourceType, resourceId });
    socket.on('connect', join);

    socket.on('record:presence', (payload) => {
      if (payload.resourceType === resourceType && payload.resourceId === resourceId) {
        setViewers(payload.viewers || []);
      }
    });

    return () => {
      socket.emit('record:leave', { resourceType, resourceId });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resourceType is expected to be a stable literal per call site (e.g. always 'Opportunity'), only resourceId varies
  }, [resourceId]);

  return viewers;
};
