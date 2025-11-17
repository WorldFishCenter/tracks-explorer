import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import { TripPoint, LiveLocation, TripPath } from '../../types';
import { petalPink, viridisColorRange } from '../../utils/colors';

interface MapLayersProps {
  filteredTripPoints: TripPoint[];
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
  showActivityGrid: boolean;
  liveLocations: LiveLocation[];
  onHover: (info: { object?: TripPoint | LiveLocation | TripPath; x: number; y: number }) => void;
  onClick: (info: { object?: TripPoint | LiveLocation | TripPath; x: number; y: number }) => void;
}

export const createMapLayers = ({
  filteredTripPoints,
  filteredTripById,
  selectedTripId,
  showActivityGrid,
  liveLocations,
  onHover,
  onClick
}: MapLayersProps): (PathLayer | ScatterplotLayer | GridLayer)[] => {
  const layers: (PathLayer | ScatterplotLayer | GridLayer)[] = [];

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

  return layers;
}; 
