// recentSelfActions - short-lived, in-memory registry used to dedupe the
// GlobalActivityToaster's WebSocket-driven toasts against the direct
// success/error toast a mutation's own handler already shows.
//
// Every opportunity mutation (create/update/close/delete) broadcasts a
// WebSocket event to ALL of that user's open connections, including the
// tab that caused it (see NotificationService.notify in the backend). That
// tab already shows its own immediate toast from the API response, so
// without this, it would show the same feedback twice - once directly,
// once from its own echo arriving back over the socket.
//
// This registry is deliberately just a plain module-scoped Map, not React
// state or a context: it only needs to answer "did *this* tab just cause
// a change to this key" for a few seconds, and - importantly - each
// browser tab gets its own separate JS module instance, so a change made
// in one tab is never marked in another tab's registry. That's exactly
// what makes the cross-tab sync work: a different tab's GlobalActivityToaster
// always finds `wasRecentSelfAction` false for someone else's change and
// shows the toast, while the originating tab suppresses its own echo.
const recentKeys = new Map(); // key -> timeout handle
const TTL_MS = 4000;

export const markSelfAction = (...keys) => {
  keys
    .filter((key) => key !== null && key !== undefined && key !== '')
    .forEach((key) => {
      const existing = recentKeys.get(key);
      if (existing) clearTimeout(existing);
      const timeout = setTimeout(() => recentKeys.delete(key), TTL_MS);
      recentKeys.set(key, timeout);
    });
};

export const wasRecentSelfAction = (...keys) =>
  keys.some((key) => key !== null && key !== undefined && key !== '' && recentKeys.has(key));
