import { useCallback, useMemo, useRef, useState } from 'react';
import toastContext from './toastContext';
import { ToastViewport } from '../components/ui/Toast';

let idCounter = 0;

/**
 * ToastProvider - app-wide toast notifications, replacing blocking
 * window.alert() calls (see OpportunitiesList.jsx, Navbar.jsx) with
 * dismissible, auto-expiring, animated notifications.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message, { type = 'info', duration = 5000, title } = {}) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type, title }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismiss,
      success: (message, opts) => showToast(message, { ...opts, type: 'success' }),
      error: (message, opts) => showToast(message, { ...opts, type: 'error' }),
      info: (message, opts) => showToast(message, { ...opts, type: 'info' }),
      warning: (message, opts) => showToast(message, { ...opts, type: 'warning' }),
    }),
    [showToast, dismiss]
  );

  return (
    <toastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </toastContext.Provider>
  );
};

export default ToastProvider;
