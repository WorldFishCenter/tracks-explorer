// User interfaces - matching our MongoDB structure
export interface MongoUser {
  _id: string;
  IMEI: string;
  Boat: string;
  Community: string;
  Region: string;
  password: string;
}

export interface AppUser {
  id: string;
  name: string;
  imeis: string[];
  role: 'admin' | 'user';
  community?: string;
  region?: string;
}

// API URL - dynamically set based on environment
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api'; // In production, use relative path for Vercel deployment

/**
 * Find a user by IMEI and password using the backend API
 */
export async function findUserByIMEI(imei: string, password: string): Promise<AppUser | null> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imei, password }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Authentication failed with status: ${response.status}`);
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

/**
 * Get all users 
 */
export async function getAllUsers(): Promise<MongoUser[]> {
  try {
    const response = await fetch(`${API_URL}/users`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
} 