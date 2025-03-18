import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { findUserByIMEI, AppUser } from '../api/authService';

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
    return new Promise(async (resolve, reject) => {
      try {
        setLoading(true);
        
        // Find user in MongoDB by IMEI and password
        const user = await findUserByIMEI(imei, password);
        
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid IMEI or password'));
        }
      } catch (error) {
        console.error('Login error:', error);
        reject(new Error('Error during login'));
      } finally {
        setLoading(false);
      }
    });
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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