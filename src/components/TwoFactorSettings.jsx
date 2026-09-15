import { useState, useCallback } from 'react';
import { ShieldIcon } from './ui/DashboardIcons';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import './TwoFactorSettings.css';

/**
 * TwoFactorSettings - enable/disable TOTP 2FA and manage backup codes from
 * the profile card. Mirrors ProfileCard's "no full modal, small inline
 * forms" style (see profile-sf-section) rather than introducing a new
 * pattern. All network calls go through AuthProvider's 2FA methods, which
 * already shape every response as { success, ... }.
 */
export const TwoFactorSettings = ({ user }) => {
  const {
    setupTwoFactor,
    confirmTwoFactorSetup,
    disableTwoFactor,
    regenerateBackupCodes,
  } = useAuth();
  const toast = useToast();

  // 'idle' | 'setup' | 'backup-codes' | 'disable' | 'regenerate'
  const [mode, setMode] = useState('idle');
  const [isBusy, setIsBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const [qrCode, setQrCode] = useState('');
  const [manualEntryKey, setManualEntryKey] = useState('');
  const [setupCode, setSetupCode] = useState('');

  const [backupCodes, setBackupCodes] = useState([]);
  const [codesSavedConfirmed, setCodesSavedConfirmed] = useState(false);

  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [regeneratePassword, setRegeneratePassword] = useState('');

  const enabled = Boolean(user?.twoFactorEnabled);

  const resetTransientState = useCallback(() => {
    setFormError('');
    setSetupCode('');
    setQrCode('');
    setManualEntryKey('');
    setDisablePassword('');
    setDisableCode('');
    setRegeneratePassword('');
    setCodesSavedConfirmed(false);
  }, []);

  const startSetup = useCallback(async () => {
    setIsBusy(true);
    setFormError('');
    const result = await setupTwoFactor();
    setIsBusy(false);

    if (result.success) {
      setQrCode(result.qrCode);
      setManualEntryKey(result.manualEntryKey);
      setMode('setup');
    } else {
      toast.error(result.error || 'Failed to start two-factor setup');
    }
  }, [setupTwoFactor, toast]);

  const submitSetupCode = useCallback(
    async (code) => {
      setIsBusy(true);
      setFormError('');

      const result = await confirmTwoFactorSetup(code);
      setIsBusy(false);

      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setMode('backup-codes');
      } else {
        setFormError(result.error || 'Invalid verification code');
      }
    },
    [confirmTwoFactorSetup]
  );

  const handleConfirmSetup = useCallback(
    (e) => {
      e.preventDefault();
      submitSetupCode(setupCode);
    },
    [submitSetupCode, setupCode]
  );

  // Same reasoning as Login.jsx's handler: strips whitespace an
  // authenticator app's own code display may include (some group the 6
  // digits as "123 456"), and auto-submits once all 6 digits are in so
  // there's no extra click before the code might rotate.
  const handleSetupCodeChange = useCallback(
    (e) => {
      const cleaned = e.currentTarget.value.replace(/\D/g, '').slice(0, 6);
      setSetupCode(cleaned);
      if (cleaned.length === 6 && !isBusy) {
        submitSetupCode(cleaned);
      }
    },
    [isBusy, submitSetupCode]
  );

  const handleDisable = useCallback(
    async (e) => {
      e.preventDefault();
      setIsBusy(true);
      setFormError('');

      const result = await disableTwoFactor({ password: disablePassword, token: disableCode });
      setIsBusy(false);

      if (result.success) {
        toast.success('Two-factor authentication disabled');
        resetTransientState();
        setMode('idle');
      } else {
        setFormError(result.error || 'Failed to disable two-factor authentication');
      }
    },
    [disableTwoFactor, disablePassword, disableCode, toast, resetTransientState]
  );

  const handleRegenerate = useCallback(
    async (e) => {
      e.preventDefault();
      setIsBusy(true);
      setFormError('');

      const result = await regenerateBackupCodes(regeneratePassword);
      setIsBusy(false);

      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setMode('backup-codes');
      } else {
        setFormError(result.error || 'Failed to regenerate backup codes');
      }
    },
    [regenerateBackupCodes, regeneratePassword]
  );

  const handleCopyBackupCodes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast.success('Backup codes copied to clipboard');
    } catch {
      toast.error('Could not copy automatically - please select and copy manually');
    }
  }, [backupCodes, toast]);

  const closeBackupCodes = useCallback(() => {
    resetTransientState();
    setBackupCodes([]);
    setMode('idle');
  }, [resetTransientState]);

  return (
    <div className="profile-2fa-section">
      <div className="profile-2fa-status">
        <span className={`sf-dot ${enabled ? 'connected' : ''}`} aria-hidden="true" />
        <div>
          <p className="profile-sf-title">
            <ShieldIcon width={14} height={14} /> Two-Factor Authentication
          </p>
          <p className="profile-sf-subtitle">
            {enabled
              ? 'Enabled - an authenticator code is required at login'
              : 'Not enabled - add an authenticator app for extra account security'}
          </p>
        </div>
      </div>

      {mode === 'idle' && (
        <div className="profile-2fa-actions">
          {enabled ? (
            <>
              <button type="button" className="profile-2fa-btn" onClick={() => { resetTransientState(); setMode('regenerate'); }}>
                Regenerate backup codes
              </button>
              <button type="button" className="profile-2fa-btn danger" onClick={() => { resetTransientState(); setMode('disable'); }}>
                Disable
              </button>
            </>
          ) : (
            <button type="button" className="profile-sf-connect-btn" onClick={startSetup} disabled={isBusy}>
              {isBusy ? 'Starting...' : 'Enable 2FA'}
            </button>
          )}
        </div>
      )}

      {mode === 'setup' && (
        <form className="profile-2fa-panel" onSubmit={handleConfirmSetup}>
          <p className="profile-2fa-hint">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, ...),
            then enter the 6-digit code it shows.
          </p>
          {qrCode && <img className="profile-2fa-qr" src={qrCode} alt="Two-factor setup QR code" />}
          <p className="profile-2fa-hint">
            Can't scan? Enter this key manually: <code className="profile-2fa-key">{manualEntryKey}</code>
          </p>
          <input
            className="profile-2fa-input"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={setupCode}
            onChange={handleSetupCodeChange}
            autoFocus
            required
          />
          {formError && <p className="profile-2fa-error">{formError}</p>}
          <div className="profile-2fa-panel-actions">
            <button type="submit" className="profile-sf-connect-btn" disabled={isBusy}>
              {isBusy ? 'Verifying...' : 'Confirm'}
            </button>
            <button type="button" className="profile-2fa-btn" onClick={() => { resetTransientState(); setMode('idle'); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'backup-codes' && (
        <div className="profile-2fa-panel">
          <p className="profile-2fa-hint">
            Save these backup codes somewhere safe. Each one can be used once to sign in if you lose
            access to your authenticator app - they won't be shown again.
          </p>
          <ul className="profile-2fa-codes">
            {backupCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <div className="profile-2fa-panel-actions">
            <button type="button" className="profile-2fa-btn" onClick={handleCopyBackupCodes}>
              Copy codes
            </button>
            <label className="profile-2fa-confirm-label">
              <input
                type="checkbox"
                checked={codesSavedConfirmed}
                onChange={(e) => setCodesSavedConfirmed(e.currentTarget.checked)}
              />
              I've saved these codes
            </label>
            <button
              type="button"
              className="profile-sf-connect-btn"
              disabled={!codesSavedConfirmed}
              onClick={closeBackupCodes}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {mode === 'disable' && (
        <form className="profile-2fa-panel" onSubmit={handleDisable}>
          <p className="profile-2fa-hint">Confirm your password and a current code to disable 2FA.</p>
          <input
            className="profile-2fa-input"
            type="password"
            placeholder="Password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.currentTarget.value)}
            autoComplete="current-password"
            required
          />
          <input
            className="profile-2fa-input"
            type="text"
            placeholder="Authenticator or backup code"
            value={disableCode}
            onChange={(e) => setDisableCode(e.currentTarget.value)}
            required
          />
          {formError && <p className="profile-2fa-error">{formError}</p>}
          <div className="profile-2fa-panel-actions">
            <button type="submit" className="profile-2fa-btn danger" disabled={isBusy}>
              {isBusy ? 'Disabling...' : 'Disable 2FA'}
            </button>
            <button type="button" className="profile-2fa-btn" onClick={() => { resetTransientState(); setMode('idle'); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'regenerate' && (
        <form className="profile-2fa-panel" onSubmit={handleRegenerate}>
          <p className="profile-2fa-hint">
            Confirm your password to generate new backup codes. Your existing codes will stop working.
          </p>
          <input
            className="profile-2fa-input"
            type="password"
            placeholder="Password"
            value={regeneratePassword}
            onChange={(e) => setRegeneratePassword(e.currentTarget.value)}
            autoComplete="current-password"
            required
          />
          {formError && <p className="profile-2fa-error">{formError}</p>}
          <div className="profile-2fa-panel-actions">
            <button type="submit" className="profile-sf-connect-btn" disabled={isBusy}>
              {isBusy ? 'Generating...' : 'Regenerate'}
            </button>
            <button type="button" className="profile-2fa-btn" onClick={() => { resetTransientState(); setMode('idle'); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TwoFactorSettings;
