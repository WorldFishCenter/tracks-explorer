import { PathLayer, ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import { TripPoint, LiveLocation, TripPath, GPSCoordinate, Waypoint } from '../../types';
import { petalPink, viridisColorRange } from '../../utils/colors';

interface MapLayersProps {
  filteredTripPoints: TripPoint[];
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
  showActivityGrid: boolean;
  liveLocations: LiveLocation[];
  deviceLocation?: GPSCoordinate | null;
  waypoints?: Waypoint[];
  onHover: (info: { object?: TripPoint | LiveLocation | TripPath | Waypoint; x: number; y: number }) => void;
  onClick: (info: { object?: TripPoint | LiveLocation | TripPath | Waypoint; x: number; y: number }) => void;
}

export const createMapLayers = ({
  filteredTripPoints,
  filteredTripById,
  selectedTripId,
  showActivityGrid,
  liveLocations,
  deviceLocation,
  waypoints = [],
  onHover,
  onClick
}: MapLayersProps): (PathLayer | ScatterplotLayer | GridLayer | IconLayer)[] => {
  const layers: (PathLayer | ScatterplotLayer | GridLayer | IconLayer)[] = [];

  // Helper function to get waypoint color based on type
  const getWaypointColor = (type: string): [number, number, number] => {
    switch (type) {
      case 'anchorage':
        return [41, 128, 185]; // Blue
      case 'productive_ground':
        return [39, 174, 96]; // Green
      case 'favorite_spot':
        return [241, 196, 15]; // Gold
      case 'other':
      default:
        return [127, 140, 141]; // Gray
    }
  };

  // Always add the grid layer if activity view is enabled
  if (showActivityGrid) {
    const gridLayer = new (GridLayer as any)({
      id: 'activity-grid',
      data: filteredTripPoints,
      pickable: true,
      extruded: true,
      cellSize: 500,  // Cell size in meters
      elevationScale: 10,
      getPosition: (d: TripPoint) => [d.longitude, d.latitude],
      // Use point count for both color and elevation to represent activity density
      getColorWeight: () => 1,  // Count of points represents activity
      getElevationWeight: () => 1,  // Count of points
      colorScaleType: 'quantize',
      elevationScaleType: 'sqrt',
      // Viridis-inspired color range
      colorRange: viridisColorRange,
      // Material for 3D lighting
      material: {
        ambient: 0.64,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [51, 51, 51]
      },
      onHover,
      onClick: onClick as any
    });
    
    layers.push(gridLayer as any);
  }

  // Add trip paths and points layers if not showing only grid or if a specific trip is selected
  if (!showActivityGrid || selectedTripId) {
    // Trip paths using PathLayer
    const pathLayer = new PathLayer({
      id: 'trip-paths',
      data: Object.keys(filteredTripById).map(tripId => {
        const points = filteredTripById[tripId];
        if (!points || points.length < 2) return null;

        return {
          tripId,
          name: `Trip ${tripId} - ${points[0]?.boatName || 'Vessel'}`,
          path: points.map(p => [p.longitude, p.latitude]),
          color: petalPink,
          width: selectedTripId === tripId ? 4 : 2
        };
      }).filter((item): item is TripPath => item !== null),
      getPath: (d: TripPath) => d.path as any,
      getColor: (d: TripPath) => d.color as any,
      getWidth: (d: TripPath) => d.width,
      widthUnits: 'pixels',
      pickable: true,
      jointRounded: true,
      capRounded: true,
      onHover,
      onClick: onClick as any
    });
    
    layers.push(pathLayer);

  }

  // Add live location markers with modern boat-style markers
  if (liveLocations.length > 0) {
    const liveLayer = new ScatterplotLayer({
      id: 'live-locations',
      data: liveLocations,
      getPosition: (d: LiveLocation) => [d.lng, d.lat],
      getFillColor: [194, 9, 90],
      getRadius: 180, // Larger radius for better visibility
      radiusUnits: 'meters',
      pickable: true,
      onHover,
      onClick,
      // Add a stroke for better definition
      stroked: true,
      getLineColor: [255, 255, 255, 255], // White border
      getLineWidth: 2,
      lineWidthUnits: 'pixels'
    });
    layers.push(liveLayer);
  }

  // Add device location marker for non-PDS users
  if (deviceLocation) {
    const deviceLayer = new ScatterplotLayer({
      id: 'device-location',
      data: [deviceLocation],
      getPosition: (d: GPSCoordinate) => [d.longitude, d.latitude],
      getFillColor: [194, 9, 90], // Same red as live locations
      getRadius: 180, // Same size as live locations
      radiusUnits: 'meters',
      pickable: true,
      onHover,
      onClick,
      // Add a stroke for better definition
      stroked: true,
      getLineColor: [255, 255, 255, 255], // White border
      getLineWidth: 2,
      lineWidthUnits: 'pixels'
    });
    layers.push(deviceLayer);
  }

  // Add waypoint markers
  if (waypoints.length > 0) {
    const waypointLayer = new ScatterplotLayer({
      id: 'waypoints',
      data: waypoints,
      getPosition: (d: Waypoint) => [d.coordinates.lng, d.coordinates.lat],
      getFillColor: (d: Waypoint) => getWaypointColor(d.type),
      getRadius: 250, // Larger than trip points for visibility
      radiusUnits: 'meters',
      pickable: true,
      onHover,
      onClick,
      stroked: true,
      getLineColor: [255, 255, 255, 255], // White border
      getLineWidth: 3,
      lineWidthUnits: 'pixels',
      // Higher z-index to render on top of trip points
      opacity: 0.9
    });
    layers.push(waypointLayer);
  }

  return layers;
}; 
