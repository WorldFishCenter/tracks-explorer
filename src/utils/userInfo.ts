import { User } from '../contexts/AuthContext';

/**
 * Render "No data" message for the specified IMEI
 */
export const renderNoImeiDataMessage = (currentUser: User | null): string => {
  if (!currentUser) return "No vessel data is available.";
  
  if (currentUser.role === 'admin') {
    return "No tracking data is available for the selected date range.";
  }
  
  const imeis = currentUser.imeis || [];
  const imeiCount = imeis.length;
  
  if (imeiCount === 0) {
    return "No vessel IMEIs are associated with your account.";
  } else if (imeiCount === 1) {
    return `No tracking data is available for your IMEI: ${imeis[0]}`;
  } else {
    return `No tracking data is available for your IMEIs: ${imeis.join(', ')}`;
  }
};

/**
 * Render user IMEI info 
 */
export const renderUserImeiInfo = (currentUser: User | null): string | null => {
  if (!currentUser || currentUser.role === 'admin') return null;
  
  const imeis = currentUser.imeis || [];
  
  if (imeis.length === 0) {
    return "No IMEIs associated with your account";
  } else if (imeis.length === 1) {
    return `Your IMEI: ${imeis[0]}`;
  } else {
    return `Your IMEIs: ${imeis.join(', ')}`;
  }
}; 