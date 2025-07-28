import { format } from 'date-fns';

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
 */
export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM d, yyyy HH:mm');
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