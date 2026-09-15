import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import authContext from './authContext';

/**
 * AuthProvider - Authentication State Management
 * Manages user authentication, session, and Salesforce connection
 *
 * FIXED:
 * - Removed unused createContext import
 * - Moved handleOAuthCallback before useEffect
 * - Fixed dependency array for useEffect
 * - Proper hook declaration order
 */

export const AuthProvider = ({ children }) => {
  // ========================================================================
  // STATE
  // ========================================================================

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // isLoading above doubles as an "an auth action is in flight" flag used by
  // things like the navbar - login/signup/loginWithSalesforce all toggle it.
  // isInitializing is separate and only ever transitions true -> false once,
  // after the initial session restore. App.jsx's full-page loading gate must
  // key off THIS, not isLoading - otherwise every login/signup attempt (even
  // a failed one) would unmount and remount the whole routed page while the
  // request is in flight, discarding whatever error/state that attempt was
  // about to show.
  const [isInitializing, setIsInitializing] = useState(true);

  // ========================================================================
  // SIGNUP - Create new account
  // ========================================================================

  const signup = useCallback(async (formData) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.post('/auth/signup', formData);

      if (response.data.status === 'ok') {
        setUser(response.data.data);
        setIsAuthenticated(true);
        return { success: true, user: response.data.data };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Signup failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========================================================================
  // LOGIN - Authenticate user
  // ========================================================================

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.post('/auth/login', { email, password });

      if (response.data.status === 'ok') {
        setUser(response.data.data);
        setIsAuthenticated(true);
        return { success: true, user: response.data.data };
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========================================================================
  // LOGOUT - End session
  // ========================================================================

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: 'Logout failed' };
    }
  }, []);

  // ========================================================================
  // SALESFORCE - Connect to Salesforce account
  // ========================================================================
  //
  // NOTE: The OAuth authorization-code exchange happens entirely on the
  // backend (see salesforce.controller.js's GET /callback). Salesforce
  // redirects the browser straight to the backend, which then redirects
  // back to this SPA with a plain `?sf=connected` / `?sfError=...` flag -
  // there is no code/state for the frontend to handle, so no callback
  // exchange needs to happen here. App.jsx just refreshes the session.

  const loginWithSalesforce = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.get('/auth/salesforce/auth-url');

      if (response.data.success) {
        // Redirect to Salesforce login
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Failed to initiate Salesforce login';
      setError(errorMessage);
      console.error('Salesforce login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ========================================================================
  // SALESFORCE - Check connection status
  // ========================================================================

  const checkSalesforceStatus = useCallback(async () => {
    try {
      const response = await api.get('/auth/salesforce/status');

      if (response.data.success) {
        return response.data.connected;
      }
      return false;
    } catch (err) {
      console.error('Error checking Salesforce status:', err);
      return false;
    }
  }, []);

  // ========================================================================
  // SALESFORCE - Disconnect from Salesforce
  // ========================================================================

  const disconnectSalesforce = useCallback(async () => {
    try {
      const response = await api.post('/auth/salesforce/disconnect');

      if (response.data.success) {
        // Update user data - remove Salesforce connection
        setUser((prev) => ({
          ...prev,
          salesforceUserId: null,
          salesforceOrgName: null,
          isSalesforceConnected: false,
        }));

        console.log('✅ Salesforce disconnected');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error disconnecting Salesforce:', err);
      setError('Failed to disconnect Salesforce');
      return false;
    }
  }, []);

  // ========================================================================
  // PREFERENCES - Update notification/display preferences (e.g. the email
  // notifications toggle in Navbar.jsx). Sends only the changed slice -
  // PUT /api/auth/profile merges it into the user's existing preferences
  // rather than replacing them (see auth.controller.js:updateProfile).
  // ========================================================================

  const updatePreferences = useCallback(async (preferences) => {
    try {
      const response = await api.put('/auth/profile', { preferences });

      if (response.data.status === 'ok') {
        setUser(response.data.data);
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      console.error('Error updating preferences:', err);
      return { success: false, error: err.message || 'Failed to update preferences' };
    }
  }, []);

  // ========================================================================
  // SESSION RESTORATION - Restore session on app load
  // ========================================================================

  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);

        const response = await api.get('/auth/me');

        if (response.data.status === 'ok') {
          setUser(response.data.data);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // 401 is expected on first visit - no token exists yet
        if (err.response?.status === 401) {
          console.log('Session restore: No token found (expected on first visit)');
        } else {
          console.error('Session restore error:', err.message);
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,

    // Auth methods
    signup,
    login,
    logout,

    // Salesforce methods
    loginWithSalesforce,
    checkSalesforceStatus,
    disconnectSalesforce,

    // Preferences
    updatePreferences,
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <authContext.Provider value={value}>
      {children}
    </authContext.Provider>
  );
};

export default AuthProvider;