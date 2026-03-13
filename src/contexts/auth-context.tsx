"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback }  from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  categoryClicks: Record<string, number>;
  language?: 'de' | 'en';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  incrementCategoryClick: (category: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER_KEY = 'newswave_mock_user';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(MOCK_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistUser = (currentUser: User | null) => {
    if (currentUser) {
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(MOCK_USER_KEY);
    }
  };

  const login = useCallback(async (email: string, name?: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = { 
      id: '1', 
      name: name || 'Demo User', 
      email, 
      avatar: `https://placehold.co/100x100.png?text=${name ? name.charAt(0).toUpperCase() : 'U'}`,
      points: 0,
      categoryClicks: { technology: 5, sports: 2, business: 8 } // Mock initial clicks
    };
    setUser(newUser);
    persistUser(newUser);
    setLoading(false);
  }, []);

  const register = useCallback(async (name: string, email: string) => {
    await login(email, name); // Simplified registration, same as login
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
    router.push('/');
  }, [router]);

  const updateUser = useCallback((updatedUserPartial: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedUserPartial };
      persistUser(newUser);
      return newUser;
    });
  }, []);
  
  const incrementCategoryClick = useCallback((category: string) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const newCategoryClicks = {
        ...prevUser.categoryClicks,
        [category]: (prevUser.categoryClicks[category] || 0) + 1,
      };
      const newUser = { ...prevUser, categoryClicks: newCategoryClicks };
      persistUser(newUser);
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser, incrementCategoryClick }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};