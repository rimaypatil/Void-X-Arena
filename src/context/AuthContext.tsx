'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  gameUid: string | null;
  gameName: string | null;
  wallet: {
    balance: number;
    winningBalance: number;
    depositBalance?: number;
    bonusBalance?: number;
    currency?: string;
  };
  stats?: {
    confirmedMatchesCount: number;
    unreadNotificationsCount: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
    phone?: string;
    gameUid?: string;
    gameName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage helper (supports Capacitor Secure Storage / Web fallback)
const REFRESH_TOKEN_KEY = 'vxa_auth_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Initialize session on mount using refresh token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
        if (!storedRefreshToken) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        const data = await res.json();
        if (data.success && data.data?.tokens) {
          const newAccess = data.data.tokens.accessToken;
          const newRefresh = data.data.tokens.refreshToken;
          setAccessToken(newAccess);
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
          await fetchProfile(newAccess);
        } else {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setUser(null);
          setAccessToken(null);
        }
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data.user);
        setAccessToken(json.data.tokens.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem(REFRESH_TOKEN_KEY, json.data.tokens.refreshToken);
        }
        return { success: true };
      }
      return { success: false, error: json.error?.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const register = async (formData: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
    phone?: string;
    gameUid?: string;
    gameName?: string;
  }) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data.user);
        setAccessToken(json.data.tokens.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem(REFRESH_TOKEN_KEY, json.data.tokens.refreshToken);
        }
        return { success: true };
      }
      return { success: false, error: json.error?.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      if (accessToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      setUser(null);
      setAccessToken(null);
    }
  };

  const refreshProfile = async () => {
    if (accessToken) {
      await fetchProfile(accessToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
