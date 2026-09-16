import { useState, useCallback } from 'react';
import { ShieldIcon } from './ui/DashboardIcons';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import './ChangePasswordForm.css';

/**
 * ChangePasswordForm - collapsed by default, expands into a small inline
 * form (same "no full modal" style as TwoFactorSettings' panels) rendered
 * in ProfileCard's Security section. Posts straight to the existing
 * POST /api/auth/change-password endpoint via AuthProvider.changePassword -
 * the session/cookie is untouched, so the user stays signed in afterward.
 */
export const ChangePasswordForm = () => {
  const { changePassword } = useAuth();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }, []);

  const handleCancel = useCallback(() => {
    reset();
    setIsOpen(false);
  }, [reset]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');

      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
      if (currentPassword === newPassword) {
        setError('New password must be different from your current password.');
        return;
      }

      setIsBusy(true);
      const result = await changePassword({ currentPassword, newPassword, confirmPassword });
      setIsBusy(false);

      if (result.success) {
        toast.success('Password changed successfully');
        reset();
        setIsOpen(false);
      } else {
        setError(result.error || 'Failed to change password');
      }
    },
    [currentPassword, newPassword, confirmPassword, changePassword, toast, reset]
  );

  return (
    <div className="change-password-section">
      <div className="change-password-status">
        <span className="sf-dot connected" aria-hidden="true" />
        <div>
          <p className="profile-sf-title">
            <ShieldIcon width={14} height={14} /> Password
          </p>
          <p className="profile-sf-subtitle">Change your account password.</p>
        </div>
      </div>

      {!isOpen ? (
        <div className="change-password-actions">
          <button type="button" className="change-password-btn" onClick={() => setIsOpen(true)}>
            Change Password
          </button>
        </div>
      ) : (
        <form className="change-password-panel" onSubmit={handleSubmit}>
          <input
            className="change-password-input"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <input
            className="change-password-input"
            type="password"
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <input
            className="change-password-input"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            autoComplete="new-password"
            required
          />
          {error && <p className="change-password-error">{error}</p>}
          <div className="change-password-panel-actions">
            <button type="submit" className="profile-sf-connect-btn" disabled={isBusy}>
              {isBusy ? 'Saving...' : 'Save New Password'}
            </button>
            <button type="button" className="change-password-btn" onClick={handleCancel} disabled={isBusy}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChangePasswordForm;
