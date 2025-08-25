import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

/**
 * Format duration from milliseconds to human-readable string
 */
export const formatDuration = (milliseconds: number): string => {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format duration from seconds to human-readable string
 */
export const formatDurationFromSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format date in a shorter way for tooltips
 * Shows time in local timezone to match the Pelagic Data Portal
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for display in components
 */
export const formatDisplayDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

/**
 * Format date with time for display
 * Shows time in local timezone to match the Pelagic Data Portal
 */
export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM d, yyyy HH:mm');
};

/**
 * Format date with time using device timezone
 * Shows time in the fisher's local timezone without technical timezone indicators
 */
export const formatDateTimeWithTimezone = (date: Date, timezone?: string): string => {
  if (timezone) {
    try {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
        // Removed timeZoneName to keep it simple for fishers
      });
    } catch (error) {
      console.warn(`Invalid timezone ${timezone}, falling back to local`, error);
    }
  }
  
  // Fallback to standard formatting
  return formatDateTime(date);
};

/**
 * Format time for live location data with device timezone awareness
 * Shows time in the fisher's local timezone without technical indicators
 */
export const formatLocationTime = (date: Date | null, timezone?: string): string => {
  if (!date) return 'Never';
  
  // If device timezone is available, use it (e.g., Africa/Maputo, Africa/Nairobi)
  if (timezone) {
    try {
      return date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
        // Removed timeZoneName to keep it simple for fishers
      });
    } catch (error) {
      console.warn(`Invalid timezone ${timezone}, falling back to local`, error);
    }
  }
  
  // Fallback to browser's local timezone if no device timezone
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get cardinal direction from heading degrees
 */
export const getDirectionFromHeading = (heading: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
};

/**
 * Format speed with appropriate units
 */
export const formatSpeed = (speed: number): string => {
  const unit = speed < 20 ? 'm/s' : 'km/h';
  return `${speed.toFixed(1)} ${unit}`;
};

/**
 * Format distance in kilometers
 */
export const formatDistance = (meters: number): string => {
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

/**
 * Format date with intuitive labels (Today, Yesterday, etc.)
 * Perfect for trip selection where fishers think in terms of days
 */
export const formatTripDate = (dateString: string, t?: (key: string) => string): string => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return t ? t('common.today') : 'Today';
  }
  
  if (isYesterday(date)) {
    return t ? t('common.yesterday') : 'Yesterday';
  }
  
  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo <= 7) {
    const daysSuffix = t ? t('common.daysAgo') : 'days ago';
    return `${daysAgo} ${daysSuffix}`;
  }
  
  // For older dates, show the formatted date
  return format(date, 'MMM d, yyyy');
};

/**
 * Format trip date with time for detailed view
 */
export const formatTripDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy HH:mm');
};

/**
 * Get day label for trip grouping (Today, Yesterday, etc.) with actual date
 */
export const getTripDayLabel = (dateString: string, t?: (key: string) => string): string => {
  const date = new Date(dateString);
  const actualDate = format(date, 'MMM d, yyyy');
  
  if (isToday(date)) {
    const todayLabel = t ? t('common.today') : 'Today';
    return `${todayLabel} (${actualDate})`;
  }
  
  if (isYesterday(date)) {
    const yesterdayLabel = t ? t('common.yesterday') : 'Yesterday';
    return `${yesterdayLabel} (${actualDate})`;
  }
  
  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo <= 7) {
    const daysSuffix = t ? t('common.daysAgo') : 'days ago';
    return `${daysAgo} ${daysSuffix} (${actualDate})`;
  }
  
  return format(date, 'EEEE, MMM d, yyyy'); // e.g., "Monday, Jan 15, 2024"
}; 