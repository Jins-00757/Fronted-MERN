import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import './DangerZone.css';

/**
 * DangerZone - account deletion, rendered at the bottom of ProfileCard.
 * "Delete" is a soft delete (the backend flips the existing `isInactive`
 * flag rather than erasing the record - see auth.controller.js's
 * deleteAccount) so the copy here is careful to say "deactivate", not
 * "permanently erase", which would overstate what actually happens.
 * Mirrors TwoFactorSettings' "no full modal, small inline confirm form"
 * pattern rather than introducing a new one.
 */
export const DangerZone = () => {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPassword('');
    setError('');
  }, []);

  const handleDelete = useCallback(
    async (e) => {
      e.preventDefault();
      setIsBusy(true);
      setError('');

      const result = await deleteAccount(password);
      setIsBusy(false);

      if (result.success) {
        toast.success('Your account has been deactivated.');
        navigate('/login');
      } else {
        setError(result.error || 'Failed to delete account');
      }
    },
    [deleteAccount, password, navigate, toast]
  );

  return (
    <div className="danger-zone">
      <div className="profile-divider" />

      <div className="danger-zone-header">
        <p className="danger-zone-title">Danger Zone</p>
        <p className="danger-zone-desc">
          Deactivate your account - you'll be signed out immediately and won't be able to log back in.
        </p>
      </div>

      {!isOpen && (
        <button type="button" className="danger-zone-btn" onClick={() => setIsOpen(true)}>
          Delete Account
        </button>
      )}

      {isOpen && (
        <form className="danger-zone-panel" onSubmit={handleDelete}>
          <p className="danger-zone-hint">
            Enter your password to confirm. This deactivates your account and signs you out right
            away - contact support if you ever need it restored.
          </p>
          <input
            className="danger-zone-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          {error && <p className="danger-zone-error">{error}</p>}
          <div className="danger-zone-actions">
            <button type="submit" className="danger-zone-btn" disabled={isBusy || !password}>
              {isBusy ? 'Deleting...' : 'Delete My Account'}
            </button>
            <button
              type="button"
              className="danger-zone-btn-cancel"
              onClick={handleCancel}
              disabled={isBusy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DangerZone;
