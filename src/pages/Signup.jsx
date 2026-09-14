import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../components/ui/AuthIcons';
import './Auth.css';

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const result = await signup({ name, email, password, confirmPassword });
    setIsLoading(false);

    if (result?.success) {
      navigate('/');
    } else {
      setError(result?.error || 'Signup failed');
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
            Create your account and turn pipeline data into revenue you can predict.
          </p>
        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        >
          <div className="auth-card-header">
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-subtitle">Get started with Sales Pipeline Intelligence</p>
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

          <form className="auth-form" onSubmit={handleSignup} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-name">Name</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><UserIcon /></span>
                <input
                  id="signup-name"
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><MailIcon /></span>
                <input
                  id="signup-email"
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
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="signup-password"
                  className="auth-input has-toggle"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
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
              <label className="auth-label" htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="signup-confirm-password"
                  className="auth-input has-toggle"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
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
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </motion.button>
          </form>

          <div className="auth-switch">
            Already have an account?{' '}
            <Link className="auth-switch-link" to="/login">Login</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
