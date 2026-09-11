import { useState } from 'react';
import { useAuth } from '../../context/useAuth';

/**
 * Salesforce connect/disconnect modal.
 *
 * Rendered by App.jsx as an overlay (onClose closes it); reads connection
 * state from `isConnected` (sourced from `user.isSalesforceConnected` in
 * AuthProvider) rather than re-fetching status itself, so it always agrees
 * with the rest of the app (navbar badge, dashboard, etc).
 */
export const SalesforceConnect = ({ onClose, isConnected }) => {
  const { loginWithSalesforce, disconnectSalesforce, user, error: authError } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState(null);
  const displayedError = error || authError;

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      await loginWithSalesforce();
      // loginWithSalesforce redirects the browser away on success, so this
      // component unmounts; isConnecting only matters if it fails.
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setIsDisconnecting(true);
    const success = await disconnectSalesforce();
    setIsDisconnecting(false);
    if (!success) {
      setError('Failed to disconnect Salesforce account. Please try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="salesforce-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 id="salesforce-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Salesforce Connection
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              lineHeight: 1,
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: '#6b7280', marginTop: '0.75rem', fontSize: '0.9rem' }}>
          {isConnected
            ? `Connected to ${user?.salesforceOrgName || 'Salesforce'}. You can view your live opportunities or disconnect below.`
            : 'Connect your Salesforce account to sync your sales pipeline and opportunities. You will be redirected to Salesforce to sign in and authorize access.'}
        </p>

        {displayedError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              background: '#fef2f2',
              color: '#991b1b',
              fontSize: '0.85rem',
              border: '1px solid #fecaca',
            }}
          >
            {displayedError}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              style={buttonStyle('#fef2f2', '#b91c1c', '1px solid #fecaca')}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Salesforce'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              style={buttonStyle('#667eea', 'white', 'none')}
            >
              {isConnecting ? 'Redirecting to Salesforce...' : 'Connect Salesforce Account'}
            </button>
          )}
          <button onClick={onClose} style={buttonStyle('#f3f4f6', '#1f2937', 'none')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const buttonStyle = (background, color, border) => ({
  flex: 1,
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  border,
  background,
  color,
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
});

export default SalesforceConnect;
