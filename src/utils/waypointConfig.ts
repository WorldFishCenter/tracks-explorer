import { WaypointType } from '../types';

/**
 * Centralized configuration for waypoint types
 * Ensures consistent colors, icons, and labels across map and UI
 */

export interface WaypointTypeConfig {
  value: WaypointType;
  labelKey: string; // Translation key
  icon: string; // Tabler icon class
  colorRGB: [number, number, number]; // For Deck.gl map rendering
  colorHex: string; // For UI styling
  colorClass: string; // Tabler CSS class for text
}

/**
 * Color palette harmonized with Tabler's exact theme colors
 * These RGB values match Tabler's CSS variables for consistency
 */
export const WAYPOINT_TYPE_CONFIGS: Record<WaypointType, WaypointTypeConfig> = {
  port: {
    value: 'port',
    labelKey: 'waypoints.types.port',
    icon: 'ti-building',
    colorRGB: [136, 84, 208], // Tabler purple: #8854d0
    colorHex: '#8854d0',
    colorClass: 'text-purple'
  },
  anchorage: {
    value: 'anchorage',
    labelKey: 'waypoints.types.anchorage',
    icon: 'ti-anchor',
    colorRGB: [32, 107, 196], // Tabler blue: #206bc4
    colorHex: '#206bc4',
    colorClass: 'text-info'
  },
  fishing_ground: {
    value: 'fishing_ground',
    labelKey: 'waypoints.types.fishing_ground',
    icon: 'ti-star-filled',
    colorRGB: [47, 179, 68], // Tabler green: #2fb344
    colorHex: '#2fb344',
    colorClass: 'text-success'
  },
  favorite_spot: {
    value: 'favorite_spot',
    labelKey: 'waypoints.types.favorite_spot',
    icon: 'ti-heart-filled',
    colorRGB: [245, 159, 0], // Tabler yellow/orange: #f59f00
    colorHex: '#f59f00',
    colorClass: 'text-warning'
  },
  other: {
    value: 'other',
    labelKey: 'waypoints.types.other',
    icon: 'ti-map-pin-filled',
    colorRGB: [102, 117, 127], // Tabler gray: #66757f
    colorHex: '#66757f',
    colorClass: 'text-secondary'
  }
};

/**
 * Get the full configuration for a waypoint type
 */
export function getWaypointConfig(type: WaypointType): WaypointTypeConfig {
  return WAYPOINT_TYPE_CONFIGS[type] || WAYPOINT_TYPE_CONFIGS.other;
}

/**
 * Get the RGB color for map rendering (Deck.gl)
 */
export function getWaypointColor(type: WaypointType): [number, number, number] {
  return getWaypointConfig(type).colorRGB;
}

/**
 * Get the hex color for UI styling
 */
export function getWaypointColorHex(type: WaypointType): string {
  return getWaypointConfig(type).colorHex;
}

/**
 * Get the Tabler icon class
 */
export function getWaypointIcon(type: WaypointType): string {
  return getWaypointConfig(type).icon;
}

/**
 * Get the Tabler CSS color class
 */
export function getWaypointColorClass(type: WaypointType): string {
  return getWaypointConfig(type).colorClass;
}

/**
 * Get all waypoint type configs as an array (useful for dropdowns)
 */
export function getAllWaypointTypeConfigs(): WaypointTypeConfig[] {
  return Object.values(WAYPOINT_TYPE_CONFIGS);
}
