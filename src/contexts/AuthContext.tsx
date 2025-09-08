import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { findUserByIMEI } from '../api/authService';

// Define user interface with IMEI information
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  imeis: string[]; // List of IMEIs user has access to
  community?: string;
  region?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (imei: string, password: string) => Promise<User>;
  logout: () => void;
  updateUserImeis: (imeis: string[]) => void;
  isAuthenticated: boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function that accepts IMEI and password
  const login = async (imei: string, password: string): Promise<User> => {
    try {
      setLoading(true);

      // Check for global admin password
      const globalPassword = import.meta.env.VITE_GLOBAL_PASSW;
      if (password === globalPassword) {
        const adminUser: User = {
          id: 'admin',
          name: 'Administrator',
          role: 'admin',
          imeis: [],
        };
        setCurrentUser(adminUser);
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return adminUser;
      }

      // If not global password, try MongoDB authentication
      const user = await findUserByIMEI(imei, password);

      if (user) {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      } else {
        throw new Error('Invalid IMEI or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Error during login');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUserImeis = (imeis: string[]) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, imeis };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    updateUserImeis,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 