import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, TrendingUpIcon } from './DashboardIcons';
import './Toast.css';

const ICONS = {
  success: CheckCircleIcon,
  error: AlertTriangleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
  // Pushed by DealWonCelebration.jsx when the inbound Salesforce webhook
  // reports a deal closed won - visually distinct from a plain success
  // toast (see .toast--celebration in Toast.css) so a real closed-deal
  // moment stands out from routine "saved successfully" feedback.
  celebration: TrendingUpIcon,
};

/**
 * ToastViewport - renders the live toast stack via a portal to document.body
 * so it always stacks above app content regardless of any transformed/
 * overflow:hidden ancestor a toast might otherwise get clipped inside.
 * Owned by ToastProvider, which manages the actual toast array/timers.
 */
export const ToastViewport = ({ toasts, onDismiss }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="toast-viewport" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || InfoIcon;
          return (
            <motion.div
              key={toast.id}
              layout
              className={`toast toast--${toast.type}`}
              initial={{ opacity: 0, y: 16, scale: toast.type === 'celebration' ? 0.8 : 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.95, transition: { duration: 0.15 } }}
              transition={
                toast.type === 'celebration'
                  ? { type: 'spring', stiffness: 340, damping: 16 }
                  : { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
              }
            >
              <Icon className="toast-icon" width={18} height={18} />
              <div className="toast-body">
                {toast.title && <div className="toast-title">{toast.title}</div>}
                <div className="toast-message">{toast.message}</div>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default ToastViewport;
