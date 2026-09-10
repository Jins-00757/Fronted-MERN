import { useState, useCallback } from 'react';
import AuthContext from './authContext';

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signup = useCallback(async (email, password) => {
    try {
      // TODO: Implement signup API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      // TODO: Implement login API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // TODO: Implement logout API call
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const value = {
    isAuthenticated,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
