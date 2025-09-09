// Helper function to check if we're in demo mode
export const isDemoMode = (): boolean => {
  try {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.isDemoMode === true;
    }
  } catch (error) {
    console.warn('Error checking demo mode:', error);
  }
  return false;
};

// Helper function to anonymize sensitive text in UI
export const anonymizeText = (text: string, replacement: string = '***'): string => {
  if (!isDemoMode()) {
    return text;
  }
  return replacement;
};

// Helper function to anonymize boat name in UI  
export const anonymizeBoatName = (boatName: string): string => {
  if (!isDemoMode()) {
    return boatName;
  }
  return 'Demo Vessel';
};

// Helper function to anonymize IMEI in UI
export const anonymizeImei = (imei: string): string => {
  if (!isDemoMode()) {
    return imei;
  }
  return '***';
};