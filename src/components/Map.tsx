import React, { useState, useEffect } from 'react';
import Map, { NavigationControl, ScaleControl } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import type { GridLayerProps } from '@deck.gl/aggregation-layers';
import type { LayerProps } from '@deck.gl/core';
import { useAuth } from '../contexts/AuthContext';
import { fetchTripPoints, TripPoint, getDateRangeForLastDays } from '../api/pelagicDataService';
import 'mapbox-gl/dist/mapbox-gl.css';
import { subDays } from 'date-fns';
import { IconGridDots, IconMapPins, IconFilter, IconFilterOff } from '@tabler/icons-react';

// Get Mapbox token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

// Viridis color palette (values from 0-255)
const viridisColors = [
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

// Type for the color array (RGB)
type RGB = [number, number, number];

// Function to get color based on speed using viridis palette
const getColorForSpeed = (speed: number): RGB => {
  // Cap speed at 20 km/h for color mapping
  const cappedSpeed = Math.min(speed || 0, 20);
  const index = Math.floor((cappedSpeed / 20) * (viridisColors.length - 1));
  return viridisColors[index] as RGB;
};

const INITIAL_VIEW_STATE = {
  longitude: 39.6, // East Africa coast (Zanzibar area based on sample data)
  latitude: -4.4,
  zoom: 7,
  pitch: 0,
  bearing: 0
};

// Format trip points for deck.gl layers
const formatPointsForLayers = (points: TripPoint[]): Record<string, TripPoint[]> => {
  const tripById: Record<string, TripPoint[]> = {};

  // Group points by trip ID
  points.forEach(point => {
    if (!tripById[point.tripId]) {
      tripById[point.tripId] = [];
    }
    tripById[point.tripId].push(point);
  });

  // Sort points in each trip by timestamp
  Object.keys(tripById).forEach(tripId => {
    tripById[tripId].sort((a, b) =>
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  });

  return tripById;
};

interface MapProps {
  onSelectVessel?: (vessel: any) => void;
  dateFrom?: Date;
  dateTo?: Date;
  selectedTripId?: string;
}

const FishersMap: React.FC<MapProps> = ({
  onSelectVessel,
  dateFrom,
  dateTo,
  selectedTripId
}) => {
  const { currentUser } = useAuth();
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [tripById, setTripById] = useState<Record<string, TripPoint[]>>({});
  const [hoveredObject, setHoveredObject] = useState<any>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');
  const [showActivityGrid, setShowActivityGrid] = useState(false);

  // Fetch trip points data for the current user
  useEffect(() => {
    const loadTripPoints = async () => {
      if (!currentUser) return;

      try {
        // Always use the user's IMEIs, regardless of role
        const imeis = currentUser.imeis;

        console.log("Loading trip points with IMEIs:", imeis);

        // Use default date range if none provided (last 7 days)
        const defaultDates = getDateRangeForLastDays(7);
        const effectiveDateFrom = dateFrom || defaultDates.dateFrom;
        const effectiveDateTo = dateTo || defaultDates.dateTo;

        const points = await fetchTripPoints({
          dateFrom: effectiveDateFrom,
          dateTo: effectiveDateTo,
          imeis,
          includeDeviceInfo: true,
          includeLastSeen: true
        });

        console.log(`Loaded ${points.length} trip points`);

        if (points.length > 0) {
          console.log("Sample point:", points[0]);
        }

        setTripPoints(points);
        const formatted = formatPointsForLayers(points);
        setTripById(formatted);

        // If we have points, adjust the view to focus on them
        if (points.length > 0) {
          // Calculate the center of all points
          const totalLat = points.reduce((sum, p) => sum + p.latitude, 0);
          const totalLng = points.reduce((sum, p) => sum + p.longitude, 0);
          const avgLat = totalLat / points.length;
          const avgLng = totalLng / points.length;

          setViewState({
            ...viewState,
            latitude: avgLat,
            longitude: avgLng,
            zoom: 10
          });
        }
      } catch (err) {
        console.error('Error loading trip points:', err);
      }
    };

    loadTripPoints();
  }, [currentUser, dateFrom, dateTo]);

  // When selectedTripId changes, focus the view on that trip
  useEffect(() => {
    if (selectedTripId && tripById[selectedTripId] && tripById[selectedTripId].length > 0) {
      const tripPoints = tripById[selectedTripId];

      // Calculate center of the selected trip's points
      const totalLat = tripPoints.reduce((sum, p) => sum + p.latitude, 0);
      const totalLng = tripPoints.reduce((sum, p) => sum + p.longitude, 0);
      const avgLat = totalLat / tripPoints.length;
      const avgLng = totalLng / tripPoints.length;

      // Find bounding box to determine zoom level
      let minLat = Number.MAX_VALUE;
      let maxLat = Number.MIN_VALUE;
      let minLng = Number.MAX_VALUE;
      let maxLng = Number.MIN_VALUE;

      tripPoints.forEach(p => {
        minLat = Math.min(minLat, p.latitude);
        maxLat = Math.max(maxLat, p.latitude);
        minLng = Math.min(minLng, p.longitude);
        maxLng = Math.max(maxLng, p.longitude);
      });

      // Set a higher zoom level for selected trips to see details better
      const zoomLevel = 11;

      setViewState({
        longitude: avgLng,
        latitude: avgLat,
        zoom: zoomLevel,
        pitch: 0,
        bearing: 0
      });
    }
  }, [selectedTripId, tripById]);

  // Filter points based on selectedTripId
  const filteredTripById = selectedTripId
    ? { [selectedTripId]: tripById[selectedTripId] || [] }
    : tripById;

  const filteredTripPoints = selectedTripId
    ? tripPoints.filter(p => p.tripId === selectedTripId)
    : tripPoints;

  // Define layers based on current view mode
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
      colorRange: [
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
      ],
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
      onHover: (info: any) => setHoveredObject(info.object),
      onClick: (info: any) => {
        if (info.object && onSelectVessel) {
          onSelectVessel({
            id: info.object.tripId,
            name: info.object.name
          });
        }
      }
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
      onHover: (info: any) => setHoveredObject(info.object),
      onClick: (info: any) => {
        if (info.object && onSelectVessel) {
          onSelectVessel({
            id: info.object.tripId,
            name: `Trip ${info.object.tripId} - ${info.object.boatName || 'Vessel'}`
          });
        }
      }
    } as any);
    
    layers.push(scatterLayer);
  }

  // Add CSS for our tooltip styling to the global scope
  useEffect(() => {
    // Add style element to head
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .deck-tooltip {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        background-color: rgba(255, 255, 255, 0.95);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        color: #333;
        max-width: 300px;
        overflow: hidden;
        z-index: 1000;
        border: 1px solid rgba(0,0,0,0.1);
        padding: 0;
      }
      .deck-tooltip .tooltip-header {
        padding: 8px 12px;
        background: rgba(51, 102, 153, 0.1);
        border-bottom: 1px solid rgba(0,0,0,0.05);
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 7px;
      }
      .deck-tooltip .tooltip-content {
        padding: 10px 12px;
      }
      .deck-tooltip .tooltip-row {
        margin: 5px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .deck-tooltip .tooltip-row span:first-child {
        color: #666;
        font-weight: 500;
        margin-right: 8px;
      }
      .deck-tooltip .badge {
        font-weight: normal;
        padding: 3px 6px;
        display: inline-block;
        border-radius: 3px;
      }
      .deck-tooltip .badge.light {
        background-color: #f0f0f0;
        color: #333;
      }
      .deck-tooltip .badge.primary {
        background-color: #0d6efd;
        color: white;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Clean up function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Helper function to format duration
  const formatDuration = (milliseconds: number): string => {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Helper function to get cardinal direction from heading
  const getDirectionFromHeading = (heading: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  // Function to format date in a shorter way
  const formatTime = (date: Date): string => {
    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Add Bootstrap icons CSS for tooltip icons */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css" />
      
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        onViewStateChange={(evt: any) => {
          const newViewState = evt.viewState;
          setViewState({
            longitude: newViewState.longitude,
            latitude: newViewState.latitude,
            zoom: newViewState.zoom,
            pitch: newViewState.pitch || 0,
            bearing: newViewState.bearing || 0
          });
        }}
        controller={true}
        layers={layers}
        getTooltip={({object, x, y}: any) => {
          if (!object) return null;
          
          // Tooltip content varies based on object type
          if (object.tripId && object.path) {
            // Trip path tooltip
            const firstPoint = filteredTripById[object.tripId]?.[0];
            const lastPoint = filteredTripById[object.tripId]?.[filteredTripById[object.tripId]?.length - 1];
            const duration = firstPoint && lastPoint 
              ? formatDuration(new Date(lastPoint.time).getTime() - new Date(firstPoint.time).getTime())
              : 'Unknown';
              
            return {
              html: `
                <div class="tooltip-header">
                  <i class="bi bi-geo-alt"></i>
                  ${object.name || "Trip"}
                </div>
                <div class="tooltip-content">
                  <div class="tooltip-row"><span>Vessel:</span> ${firstPoint?.boatName || 'Unknown'}</div>
                  ${firstPoint ? `<div class="tooltip-row"><span>Started:</span> ${formatTime(new Date(firstPoint.time))}</div>` : ''}
                  ${lastPoint ? `<div class="tooltip-row"><span>Ended:</span> ${formatTime(new Date(lastPoint.time))}</div>` : ''}
                  <div class="tooltip-row"><span>Duration:</span> ${duration}</div>
                </div>
              `
            };
          } else if (object.time) {
            // Point tooltip
            return {
              html: `
                <div class="tooltip-header">
                  <i class="bi bi-pin-map"></i>
                  GPS Position
                </div>
                <div class="tooltip-content">
                  <div class="tooltip-row"><span>Time:</span> ${formatTime(new Date(object.time))}</div>
                  <div class="tooltip-row"><span>Speed:</span> <span class="badge light">
                    ${object.speed.toFixed(1)} ${object.speed < 20 ? 'm/s' : 'km/h'}</span>
                  </div>
                  <div class="tooltip-row"><span>Heading:</span> ${object.heading.toFixed(0)}° ${getDirectionFromHeading(object.heading)}</div>
                  <div class="tooltip-row"><span>Vessel:</span> ${object.boatName || 'Unknown'}</div>
                  <div class="tooltip-row"><span>Trip ID:</span> ${object.tripId || 'Unknown'}</div>
                </div>
              `
            };
          } else if (object.count) {
            // Grid cell tooltip
            const coordinates = object.position 
              ? `${object.position[1].toFixed(4)}, ${object.position[0].toFixed(4)}` 
              : 'Unknown';
              
            return {
              html: `
                <div class="tooltip-header">
                  <i class="bi bi-grid"></i>
                  Visited Location
                </div>
                <div class="tooltip-content">
                  <div class="tooltip-row">
                    <span>Times visited:</span> <span class="badge primary">${object.count}</span>
                  </div>
                  <div class="tooltip-row"><span>Cell size:</span> 500×500 meters</div>
                  ${selectedTripId ? `<div class="tooltip-row"><span>Trip:</span> ${selectedTripId}</div>` : ''}
                </div>
              `
            };
          }
          
          return null;
        }}
      >
        <Map
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
        >
          <NavigationControl position="top-left" />
          <ScaleControl position="bottom-left" />
        </Map>
      </DeckGL>

      {/* Map Control Buttons */}
      <div className="position-absolute" style={{ top: '10px', right: '10px', zIndex: 100 }}>
        <div className="d-flex flex-column gap-2">
          {/* Activity Grid Toggle Button with integrated indicator */}
          <div className="btn-group" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
            <button
              className={`btn ${showActivityGrid ? 'btn-outline-light' : 'btn-primary'}`}
              onClick={() => setShowActivityGrid(false)}
              disabled={!showActivityGrid}
              style={{ 
                borderTopRightRadius: 0, 
                borderBottomRightRadius: 0,
                opacity: showActivityGrid ? 0.7 : 1,
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <IconMapPins size={20} stroke={1.5} />
              <span className="d-none d-md-inline">Trips</span>
            </button>
            <button
              className={`btn ${!showActivityGrid ? 'btn-outline-light' : 'btn-primary'}`}
              onClick={() => setShowActivityGrid(true)}
              disabled={showActivityGrid}
              style={{ 
                borderTopLeftRadius: 0, 
                borderBottomLeftRadius: 0,
                opacity: !showActivityGrid ? 0.7 : 1,
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <IconGridDots size={20} stroke={1.5} />
              <span className="d-none d-md-inline">Visits</span>
            </button>
          </div>

          {/* Reset filter button - only show when a trip is selected */}
          {selectedTripId && (
            <button
              className="btn btn-light"
              onClick={() => onSelectVessel && onSelectVessel(null)}
              title="Show All Trips"
              aria-label="Show All Trips"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
              }}
            >
              <IconFilterOff size={20} stroke={1.5} />
              <span className="d-none d-md-inline">Show all trips</span>
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className="card"
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          zIndex: 1,
          width: '200px',
          opacity: 0.9
        }}
      >
        <div className="card-body p-2">
          <h3 className="card-title mb-2">{showActivityGrid ? "Visit Frequency" : "Speed"}</h3>
          <div className="mb-2" style={{ height: '20px', background: 'linear-gradient(to right, rgb(68,1,84), rgb(72,40,120), rgb(62,74,137), rgb(49,104,142), rgb(38,130,142), rgb(31,158,137), rgb(53,183,121), rgb(109,205,89), rgb(180,222,44), rgb(253,231,37))' }}></div>
          <div className="d-flex justify-content-between">
            <span>{showActivityGrid ? "Few" : "0 km/h"}</span>
            <span>{showActivityGrid ? "Many" : "20 km/h"}</span>
          </div>
          <div className="text-muted small mt-1">
            {showActivityGrid 
              ? "Number of times locations were visited (500m grid cells)" 
              : "Color indicates vessel speed"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishersMap; 