// User interfaces - matching our MongoDB structure
export interface MongoUser {
  _id: string;
  IMEI: string;
  Boat: string;
  captain?: string;
  vessel_type?: string;
  Community: string;
  Region: string;
  Country?: string;
  password: string;
}

export interface AppUser {
  id: string;
  name: string;
  imeis: string[];
  role: 'admin' | 'user';
  community?: string;
  region?: string;
  hasImei?: boolean;
}

// API URL - Use relative path to leverage Vite proxy in development
// Vite proxy (configured in vite.config.ts) routes /api/* to localhost:3001/api/*
const API_URL = '/api';

/**
 * Find a user by IMEI/Boat name and password using the backend API
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

// Password Reset Flow Interfaces
export interface PasswordResetRequestResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  formattedPhone?: string; // Phone number formatted with country code
}

export interface PasswordResetVerifyResponse {
  success: boolean;
  resetToken: string;
  expiresIn: number;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetError {
  error: string;
  retryAfter?: number;
  attemptsLeft?: number;
  details?: string;
}

/**
 * Request password reset - Step 1: Send OTP to user's phone
 * @param identifier - User's IMEI, boat name, or username
 * @param phoneNumber - User's phone number (international format)
 */
export async function requestPasswordReset(
  identifier: string,
  phoneNumber: string
): Promise<PasswordResetRequestResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to request password reset');
    }

    return data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
}

/**
 * Verify OTP code - Step 2: Validate the code sent to user's phone
 * @param phoneNumber - User's phone number
 * @param otp - 6-digit OTP code
 */
export async function verifyResetOTP(
  phoneNumber: string,
  otp: string
): Promise<PasswordResetVerifyResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify OTP');
    }

    return data;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

/**
 * Reset password - Step 3: Set new password using reset token
 * @param resetToken - Token received after OTP verification
 * @param newPassword - New password (min 6 characters)
 */
export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<PasswordResetResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resetToken, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
} 