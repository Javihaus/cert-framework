'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  apiKey: string;
  createdAt?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Stats {
  totalTraces: number;
  byStatus: {
    pass: number;
    fail: number;
    review: number;
    pending: number;
  };
  totalTokens: number;
}

interface AuthContextType {
  user: User | null;
  projects: Project[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name: string; company?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user on mount
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        setProjects(data.projects || []);
        setStats(data.stats || null);
      } else {
        setUser(null);
        setProjects([]);
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return false;
      }

      setUser(data.user);
      await refresh(); // Fetch full user data including projects and stats
      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  };

  const register = async (data: { email: string; password: string; name: string; company?: string }): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return false;
      }

      setUser(result.user);
      await refresh(); // Fetch full user data including projects
      return true;
    } catch (err) {
      setError('Network error. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProjects([]);
      setStats(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        projects,
        stats,
        loading,
        error,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
