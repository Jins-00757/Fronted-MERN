import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { MailIcon, AlertIcon } from '../components/ui/AuthIcons';
import api from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="auth-tagline">
            Forgot your password? No worries, we'll email you a reset link.
          </p>
        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        >
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-card-header">
                <h1 className="auth-card-title">Check your email</h1>
                <p className="auth-card-subtitle">
                  If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                  It expires in 30 minutes.
                </p>
              </div>
              <div className="auth-switch">
                <Link className="auth-switch-link" to="/login">Back to login</Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="auth-card-header">
                <h1 className="auth-card-title">Reset your password</h1>
                <p className="auth-card-subtitle">Enter the email associated with your account</p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="auth-error"
                    role="alert"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertIcon />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="forgot-email">Email</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><MailIcon /></span>
                    <input
                      id="forgot-email"
                      className="auth-input"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.currentTarget.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="auth-submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.015 } : undefined}
                  whileTap={!isLoading ? { scale: 0.985 } : undefined}
                >
                  {isLoading && <span className="auth-spinner" aria-hidden="true" />}
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </motion.button>
              </form>

              <div className="auth-switch">
                Remembered your password?{' '}
                <Link className="auth-switch-link" to="/login">Login</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
