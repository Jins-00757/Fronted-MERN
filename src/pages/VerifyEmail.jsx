import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { AlertIcon } from '../components/ui/AuthIcons';
import { CheckCircleIcon } from '../components/ui/DashboardIcons';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import './Auth.css';

/**
 * VerifyEmail - lands here from the link mailed by POST /auth/verify-email
 * (see auth.controller.js). Deliberately works whether or not the visitor
 * has an active session in this browser - the token itself is the proof,
 * not the session cookie - but if they *are* logged in here, it refreshes
 * AuthProvider's user so the "unverified" reminder clears immediately.
 */
export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { isAuthenticated, refreshUser } = useAuth();

  const [status, setStatus] = useState(token ? 'verifying' : 'missing-token');
  const [message, setMessage] = useState('');
  // StrictMode/effect re-runs must never fire the verify request twice -
  // it's a single-use token, so a second call would just show a confusing
  // "invalid or expired" error right after the first call succeeded.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        if (isAuthenticated) {
          await refreshUser();
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'This verification link is invalid or has expired.');
      }
    };

    verify();
  }, [token, isAuthenticated, refreshUser]);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <motion.div
          className="auth-brand"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Logo size={52} stacked />
          <p className="auth-tagline">Confirming your email address.</p>
        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        >
          {status === 'missing-token' && (
            <div className="auth-card-header">
              <h1 className="auth-card-title">Verification link missing its token</h1>
              <p className="auth-card-subtitle">
                Please use the link from your verification email, or request a new one from your profile menu.
              </p>
            </div>
          )}

          {status === 'verifying' && (
            <div className="auth-card-header">
              <span className="auth-status-spinner" aria-hidden="true" />
              <h1 className="auth-card-title">Verifying your email...</h1>
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              <div className="auth-card-header">
                <span className="auth-status-icon success" aria-hidden="true">
                  <CheckCircleIcon width={26} height={26} />
                </span>
                <h1 className="auth-card-title">Email verified</h1>
                <p className="auth-card-subtitle">
                  Your email address has been confirmed. Thanks for verifying your account.
                </p>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="auth-card-header">
              <div className="auth-error" role="alert" style={{ marginBottom: '1rem' }}>
                <AlertIcon />
                <span>{message}</span>
              </div>
              <h1 className="auth-card-title">Couldn&apos;t verify email</h1>
              <p className="auth-card-subtitle">
                Verification links expire after 24 hours. Sign in and request a new one from your profile menu.
              </p>
            </div>
          )}

          <div className="auth-switch">
            <Link className="auth-switch-link" to={isAuthenticated ? '/' : '/login'}>
              {isAuthenticated ? 'Go to dashboard' : 'Back to login'}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
