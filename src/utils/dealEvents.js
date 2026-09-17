// dealEvents - tiny module-scoped pub/sub, same idiom as recentSelfActions.js,
// for broadcasting a "deal closed" event (from the Salesforce webhook - see
// DealWonCelebration.jsx) to whichever page components are mounted right
// now, without every one of them opening its own WebSocket connection.
// DealWonCelebration is the single, always-mounted WS listener (see App.jsx);
// this is how it hands the event off to Dashboard/OpportunitiesList so their
// live numbers and stage badges can update without a page refresh.
const target = new EventTarget();
const EVENT_NAME = 'deal-closed';

export const emitDealClosed = (detail) => {
  target.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
};

/** Returns an unsubscribe function - call it from a `useEffect` cleanup. */
export const onDealClosed = (handler) => {
  const listener = (event) => handler(event.detail);
  target.addEventListener(EVENT_NAME, listener);
  return () => target.removeEventListener(EVENT_NAME, listener);
};
