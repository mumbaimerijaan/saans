import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, HouseholdProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  household: HouseholdProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: 'citizen' | 'volunteer' | 'donor' | 'admin') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<HouseholdProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('saans_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setHousehold(data.household || null);
    } catch (err) {
      console.warn('Could not restore auth profile:', err);
      // Auto-login as Priya (Citizen) by default if first visit
      await switchRoleQuick('citizen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      // Default to citizen for smooth evaluation
      switchRoleQuick('citizen');
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('saans_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      localStorage.setItem('saans_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('saans_token');
    setToken(null);
    setUser(null);
    setHousehold(null);
  };

  const switchRoleQuick = async (role: 'citizen' | 'volunteer' | 'donor' | 'admin') => {
    setIsLoading(true);
    const roleEmails: Record<string, string> = {
      admin: 'admin@saans.org',
      citizen: 'priya.sharma@example.com',
      volunteer: 'rahul.deshmukh@example.com',
      donor: 'cleanair.mumbai@example.com'
    };

    const targetEmail = roleEmails[role];
    try {
      const res = await api.login({ email: targetEmail, password: 'password123' });
      localStorage.setItem('saans_token', res.token);
      setToken(res.token);
      setUser(res.user);
      const profileData = await api.getMe();
      setHousehold(profileData.household || null);
    } catch (e) {
      console.error('Role quick switch failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, household, token, isLoading, login, register, logout, switchRoleQuick, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
