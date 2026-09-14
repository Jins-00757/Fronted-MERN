import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../components/ui/AuthIcons';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result?.success) {
      navigate('/');
    } else {
      setError(result?.error || 'Login failed');
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
            Sign in to track deals, forecast revenue, and stay ahead of your pipeline.
          </p>
        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        >
          <div className="auth-card-header">
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-subtitle">Log in to your Sales Pipeline Intelligence account</p>
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

          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><MailIcon /></span>
                <input
                  id="login-email"
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

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">Password</label>
                <Link className="auth-inline-link" to="/forgot-password">Forgot password?</Link>
              </div>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="login-password"
                  className="auth-input has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  autoComplete="current-password"
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

            <motion.button
              type="submit"
              className="auth-submit"
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.015 } : undefined}
              whileTap={!isLoading ? { scale: 0.985 } : undefined}
            >
              {isLoading && <span className="auth-spinner" aria-hidden="true" />}
              {isLoading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          <div className="auth-switch">
            Don't have an account?{' '}
            <Link className="auth-switch-link" to="/signup">Sign up</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
