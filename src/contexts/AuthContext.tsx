import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define user interface with IMEI information
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  imeis: string[]; // List of IMEIs user has access to
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo purposes - in production this would come from a backend
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Admin User',
    role: 'admin',
    imeis: [] // Admin can see all IMEIs, so no restrictions
  },
  {
    id: '2',
    name: 'Fisher One',
    role: 'user',
    imeis: ['123456789012345'] // User identified by their IMEI
  },
  {
    id: '3',
    name: 'Fisher Two',
    role: 'user',
    imeis: ['987654321098765'] // User identified by their IMEI
  }
];

// Add direct IMEI-based access for simpler login
const IMEI_USERS = [
  {
    id: '4',
    name: 'IMEI User 123456789012345',
    role: 'user' as const,
    imeis: ['123456789012345']
  },
  {
    id: '5',
    name: 'IMEI User 987654321098765',
    role: 'user' as const,
    imeis: ['987654321098765']
  }
];

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

  // Login function that now accepts IMEI as username
  const login = async (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        // First, try to find user by traditional username
        let user = MOCK_USERS.find(u => u.name.toLowerCase() === username.toLowerCase());
        
        // If not found, check if username is actually an IMEI
        if (!user) {
          // Check if the username is an IMEI number (15 digits)
          const isImei = /^\d{15}$/.test(username);
          
          if (isImei) {
            // Try to find a predefined IMEI user
            user = IMEI_USERS.find(u => u.imeis.includes(username));
            
            // If no predefined user with this IMEI, create a new one on the fly
            if (!user) {
              user = {
                id: `imei-${username}`,
                name: `Vessel ${username.slice(-4)}`, // Use last 4 digits for display name
                role: 'user',
                imeis: [username]
              };
            }
          }
        }
        
        // Simple password validation (for demo)
        // For IMEI users, we just need any non-empty password
        const passwordValid = 
          (user && password === 'password') || 
          (user && /^\d{15}$/.test(username) && password.length > 0);
        
        if (user && passwordValid) {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 500);
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