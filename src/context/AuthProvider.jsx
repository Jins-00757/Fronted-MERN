import { useState, useCallback, useEffect } from 'react';
import authContext from './authContext';
import api from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/auth/me');
        if (response) {
          setUser(response);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Session restore failed:', err.message);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const signup = useCallback(async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      setUser(response);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithSalesforce = useCallback(async () => {
    try {
      const response = await api.get('/auth/salesforce/authorize');
      if (response.authUrl) {
        window.location.href = response.authUrl;
      }
    } catch (err) {
      setError(err.message || 'Salesforce login failed');
      throw err;
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/salesforce/callback', { code });
      setUser(response);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.message || 'OAuth callback failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    signup,
    login,
    loginWithSalesforce,
    handleOAuthCallback,
    logout,
  };

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
};