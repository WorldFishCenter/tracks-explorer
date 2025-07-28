// Map configuration options
export interface MapConfig {
  // Enable/disable Mapbox analytics events (telemetry)
  enableMapboxEvents: boolean;
  
  // Enable/disable Mapbox attribution
  showAttribution: boolean;
  
  // Map style configuration
  defaultMapStyle: string;
  
  // Cache settings
  enableTileCaching: boolean;
}

// Default configuration
export const defaultMapConfig: MapConfig = {
  enableMapboxEvents: true,
  showAttribution: false,
  defaultMapStyle: 'mapbox://styles/mapbox/satellite-v9',
  enableTileCaching: true,
};

// Get configuration from environment variables or use defaults
export const getMapConfig = (): MapConfig => {
  return {
    enableMapboxEvents: import.meta.env.VITE_ENABLE_MAPBOX_EVENTS !== 'false',
    showAttribution: import.meta.env.VITE_SHOW_MAPBOX_ATTRIBUTION === 'true',
    defaultMapStyle: import.meta.env.VITE_DEFAULT_MAP_STYLE || defaultMapConfig.defaultMapStyle,
    enableTileCaching: import.meta.env.VITE_ENABLE_TILE_CACHING !== 'false',
  };
};

// Helper function to check if Mapbox events should be enabled
export const shouldEnableMapboxEvents = (): boolean => {
  const config = getMapConfig();
  return config.enableMapboxEvents;
}; 