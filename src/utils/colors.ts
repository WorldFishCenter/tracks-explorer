import { RGB } from '../types';

// Viridis color palette (values from 0-255)
export const viridisColors: RGB[] = [
  [68, 1, 84],    // Dark purple (lowest)
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37]  // Yellow (highest)
];

/**
 * Get color based on speed using viridis palette
 */
export const getColorForSpeed = (speed: number): RGB => {
  // Cap speed at 20 km/h for color mapping
  const cappedSpeed = Math.min(speed || 0, 20);
  const index = Math.floor((cappedSpeed / 20) * (viridisColors.length - 1));
  return viridisColors[index];
};

/**
 * Get battery badge class based on battery state
 */
export const getBatteryBadgeClass = (batteryState: string): string => {
  if (batteryState.includes('Low')) return 'bg-warning text-dark';
  if (batteryState.includes('Critical')) return 'bg-danger text-white';
  return 'bg-success text-white';
};

/**
 * Viridis color range for grid layers (with alpha)
 */
export const viridisColorRange = [
  [68, 1, 84, 180],
  [72, 40, 120, 180],
  [62, 74, 137, 180],
  [49, 104, 142, 180],
  [38, 130, 142, 180], 
  [31, 158, 137, 180],
  [53, 183, 121, 180],
  [109, 205, 89, 180],
  [180, 222, 44, 180],
  [253, 231, 37, 180]
]; 