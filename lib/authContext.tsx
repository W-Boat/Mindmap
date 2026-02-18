import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getToken, getUser, logout as authLogout } from '../services/authService';
import { getCurrentLanguage, setLanguage } from './i18n';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  language: string;
  setLanguage: (lang: string) => void;
  logout: () => void;
  refreshUser: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguageState] = useState(getCurrentLanguage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setToken(null);
  };

  const handleSetLanguage = (lang: string) => {
    if (lang === 'zh' || lang === 'en') {
      setLanguage(lang);
      setLanguageState(lang);
    }
  };

  const refreshUser = () => {
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isAdmin,
    token,
    language,
    setLanguage: handleSetLanguage,
    logout: handleLogout,
    refreshUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
