import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('brokeaf_token');
        const savedUser = localStorage.getItem('brokeaf_user');
        
        if (token && savedUser) {
          // Verify token is still valid
          const response = await authAPI.getProfile();
          setUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('brokeaf_token');
        localStorage.removeItem('brokeaf_user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      
      // Save to localStorage
      localStorage.setItem('brokeaf_token', token);
      localStorage.setItem('brokeaf_user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      // Save to localStorage
      localStorage.setItem('brokeaf_token', token);
      localStorage.setItem('brokeaf_user', JSON.stringify(newUser));
      
      // Update state
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('brokeaf_token');
    localStorage.removeItem('brokeaf_user');
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('brokeaf_user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      return { success: false, error: message };
    }
  };

  const deleteAccount = async (password) => {
    try {
      await authAPI.deleteAccount(password);
      
      // Clear localStorage
      localStorage.removeItem('brokeaf_token');
      localStorage.removeItem('brokeaf_user');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Account deletion failed';
      return { success: false, error: message };
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('brokeaf_user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

