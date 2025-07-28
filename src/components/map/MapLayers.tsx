import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import { TripPoint, LiveLocation } from '../../types';
import { getColorForSpeed } from '../../utils/colors';

// Color range for activity grid (viridis-inspired)
const viridisColorRange = [
  [68, 1, 84, 255],   // Dark purple
  [59, 82, 139, 255], // Blue
  [33, 145, 140, 255], // Teal
  [94, 201, 98, 255], // Green
  [253, 231, 37, 255]  // Yellow
];

interface MapLayersProps {
  filteredTripPoints: TripPoint[];
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
  showActivityGrid: boolean;
  liveLocations: LiveLocation[];
  onHover: (info: any) => void;
  onClick: (info: any) => void;
}

export const createMapLayers = ({
  filteredTripPoints,
  filteredTripById,
  selectedTripId,
  showActivityGrid,
  liveLocations,
  onHover,
  onClick
}: MapLayersProps): any[] => {
  const layers: any[] = [];

  // Always add the grid layer if activity view is enabled
  if (showActivityGrid) {
    const gridLayer = new GridLayer({
      id: 'activity-grid',
      data: filteredTripPoints,
      pickable: true,
      extruded: true,
      cellSize: 500,  // Cell size in meters
      elevationScale: 10,
      getPosition: (d: TripPoint) => [d.longitude, d.latitude],
      // Use point count for both color and elevation to represent activity density
      getColorWeight: (d: TripPoint) => 1,  // Count of points represents activity
      getElevationWeight: (d: TripPoint) => 1,  // Count of points
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
      }
    } as any);
    
    layers.push(gridLayer);
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
          color: selectedTripId === tripId ? [0, 150, 255] : [0, 100, 200],
          width: selectedTripId === tripId ? 4 : 2
        };
      }).filter(Boolean),
      getPath: (d: any) => d.path,
      getColor: (d: any) => d.color,
      getWidth: (d: any) => d.width,
      widthUnits: 'pixels',
      pickable: true,
      jointRounded: true,
      capRounded: true,
      onHover,
      onClick
    } as any);
    
    layers.push(pathLayer);

    // Trip points as circles
    const scatterLayer = new ScatterplotLayer({
      id: 'trip-points',
      data: filteredTripPoints,
      getPosition: (d: TripPoint) => [d.longitude, d.latitude],
      getColor: (d: any) => getColorForSpeed(d.speed || 0),
      getRadius: (d: TripPoint) => selectedTripId && d.tripId === selectedTripId ? 70 : 50,
      radiusUnits: 'meters',
      pickable: true,
      onHover,
      onClick
    } as any);
    
    layers.push(scatterLayer);
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
    } as any);
    layers.push(liveLayer);
  }

  return layers;
}; 