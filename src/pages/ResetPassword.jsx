import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { LockIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../components/ui/AuthIcons';
import api from '../services/api';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Could not reset your password. The link may have expired.');
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
          <p className="auth-tagline">Choose a new password for your account.</p>
        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        >
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-card-header">
                <h1 className="auth-card-title">Password reset</h1>
                <p className="auth-card-subtitle">
                  Your password has been changed successfully. Redirecting you to login...
                </p>
              </div>
              <div className="auth-switch">
                <Link className="auth-switch-link" to="/login">Go to login now</Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="auth-card-header">
                <h1 className="auth-card-title">Set a new password</h1>
                <p className="auth-card-subtitle">Make sure it's at least 8 characters</p>
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
                  <label className="auth-label" htmlFor="reset-new-password">New Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><LockIcon /></span>
                    <input
                      id="reset-new-password"
                      className="auth-input has-toggle"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.currentTarget.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reset-confirm-password">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><LockIcon /></span>
                    <input
                      id="reset-confirm-password"
                      className="auth-input has-toggle"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
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
                  {isLoading ? 'Resetting...' : 'Reset password'}
                </motion.button>
              </form>

              <div className="auth-switch">
                <Link className="auth-switch-link" to="/login">Back to login</Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
