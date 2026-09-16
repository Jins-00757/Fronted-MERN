import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, AlertIcon } from '../components/ui/AuthIcons';
import { CheckCircleIcon } from '../components/ui/DashboardIcons';
import { JOB_FUNCTIONS, TERRITORIES } from '../utils/profileOptions';
import './Auth.css';

const STEP_LABELS = ['Account', 'Role', 'Territory', 'Review'];
const TOTAL_STEPS = STEP_LABELS.length;

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [territory, setTerritory] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateStep1 = () => {
    if (!name || !email || !password || !confirmPassword) return 'All fields are required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      const validationError = validateStep1();
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (step === 2 && !jobTitle) {
      setError('Please select your role');
      return;
    } else if (step === 3 && !territory) {
      setError('Please select your territory');
      return;
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step < TOTAL_STEPS) {
      handleNext();
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await signup({ name, email, password, confirmPassword, jobTitle, territory });
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
            <p className="auth-card-subtitle">
              Step {step} of {TOTAL_STEPS} · {STEP_LABELS[step - 1]}
            </p>
          </div>

          <div className="signup-step-indicator" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={`signup-step-dot ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}
                title={label}
              />
            ))}
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
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-account"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
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
                        autoFocus
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
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-role"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="auth-label">What's your role?</p>
                  <div className="role-picker">
                    {JOB_FUNCTIONS.map((jf) => (
                      <button
                        key={jf.value}
                        type="button"
                        className={`role-card ${jobTitle === jf.value ? 'selected' : ''}`}
                        onClick={() => setJobTitle(jf.value)}
                        aria-pressed={jobTitle === jf.value}
                      >
                        <span className="role-card-title">{jf.value}</span>
                        <span className="role-card-desc">{jf.description}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-territory"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="signup-territory">Territory</label>
                    <select
                      id="signup-territory"
                      className="auth-input territory-select"
                      value={territory}
                      onChange={(e) => setTerritory(e.currentTarget.value)}
                      required
                    >
                      <option value="" disabled>Select your territory</option>
                      {TERRITORIES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-review"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="auth-label">Review your details</p>
                  <div className="signup-review">
                    <div className="signup-review-row">
                      <span>Name</span>
                      <strong>{name}</strong>
                    </div>
                    <div className="signup-review-row">
                      <span>Email</span>
                      <strong>{email}</strong>
                    </div>
                    <div className="signup-review-row">
                      <span>Password</span>
                      <strong>••••••••</strong>
                    </div>
                    <div className="signup-review-row">
                      <span>Role</span>
                      <strong>{jobTitle}</strong>
                    </div>
                    <div className="signup-review-row">
                      <span>Territory</span>
                      <strong>{territory}</strong>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="signup-step-actions">
              {step > 1 && (
                <button
                  type="button"
                  className="auth-btn-secondary"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </button>
              )}
              <motion.button
                type="submit"
                className="auth-submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.015 } : undefined}
                whileTap={!isLoading ? { scale: 0.985 } : undefined}
              >
                {isLoading && <span className="auth-spinner" aria-hidden="true" />}
                {step < TOTAL_STEPS
                  ? 'Next'
                  : isLoading
                    ? 'Creating account...'
                    : (
                      <>
                        <CheckCircleIcon width={16} height={16} /> Create Account
                      </>
                    )}
              </motion.button>
            </div>
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
