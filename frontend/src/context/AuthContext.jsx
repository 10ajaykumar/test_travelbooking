import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

/**
 * Custom hook to consume AuthContext conveniently.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider wraps the app and supplies authentication state + actions.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // On mount: restore session from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Optionally refresh profile from server
          try {
            const profile = await authService.getProfile();
            const freshUser = profile.user || profile;
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch {
            // Token may be expired; clear session
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Register a new user account.
   * @param {{ name: string, email: string, password: string }} data
   */
  const register = useCallback(async (data) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      const { token, user: newUser } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login with email and password.
   * @param {{ email: string, password: string }} data
   */
  const login = useCallback(async (data) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      const { token, user: loggedInUser } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please check your credentials.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout the current user and clear the session.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }, []);

  /**
   * Clear authentication errors.
   */
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    login,
    logout,
    register,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
