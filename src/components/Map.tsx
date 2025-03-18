import React, { useState, useEffect } from 'react';
import Map, { NavigationControl, ScaleControl } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { useAuth } from '../contexts/AuthContext';
import { fetchTripPoints, TripPoint, getDateRangeForLastDays } from '../api/pelagicDataService';
import 'mapbox-gl/dist/mapbox-gl.css';
import { subDays } from 'date-fns';

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

// Function to get color based on speed using viridis palette
const getColorForSpeed = (speed: number) => {
  // Cap speed at 20 km/h for color mapping
  const cappedSpeed = Math.min(speed || 0, 20);
  const index = Math.floor((cappedSpeed / 20) * (viridisColors.length - 1));
  return viridisColors[index];
};

const INITIAL_VIEW_STATE = {
  longitude: 39.2, // East Africa coast (Zanzibar area based on sample data)
  latitude: -6.0,
  zoom: 10,
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

  // Fetch trip points data for the current user
  useEffect(() => {
    const loadTripPoints = async () => {
      if (!currentUser) return;
      
      try {
        // Use the user's IMEIs or fetch all if admin
        const imeis = currentUser.role === 'admin' ? undefined : currentUser.imeis;
        
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

  // Convert trip data into deck.gl layers
  const layers = [
    // Trip paths as lines
    new LineLayer({
      id: 'trip-paths',
      data: Object.keys(filteredTripById).map(tripId => {
        const points = filteredTripById[tripId];
        if (!points || points.length < 2) return null;
        
        return {
          tripId,
          name: `Trip ${tripId} - ${points[0]?.boatName || 'Vessel'}`,
          points,
          color: selectedTripId === tripId ? [0, 150, 255] : [0, 100, 200], // Highlight selected trip
          startPoint: points[0],
          endPoint: points[points.length - 1],
          width: selectedTripId === tripId ? 4 : 2 // Make selected trip line thicker
        };
      }).filter(Boolean),
      getSourcePosition: d => [d.startPoint.longitude, d.startPoint.latitude],
      getTargetPosition: d => [d.endPoint.longitude, d.endPoint.latitude],
      getColor: d => d.color,
      getWidth: d => d.width,
      widthUnits: 'pixels',
      pickable: true,
      onHover: (info: any) => setHoveredObject(info.object),
      onClick: (info: any) => {
        if (info.object && onSelectVessel) {
          onSelectVessel({
            id: info.object.tripId,
            name: info.object.name
          });
        }
      }
    }),
    
    // Trip points as circles
    new ScatterplotLayer({
      id: 'trip-points',
      data: filteredTripPoints,
      getPosition: (d: TripPoint) => [d.longitude, d.latitude],
      getColor: d => {
        // Always use speed-based colors for better visualization
        return getColorForSpeed(d.speed || 0) as [number, number, number];
      },
      getRadius: (d: TripPoint) => selectedTripId && d.tripId === selectedTripId ? 70 : 50, // Larger points for selected trip
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
    })
  ];

  // Render tooltip on hover
  const renderTooltip = () => {
    if (!hoveredObject) {
      return null;
    }

    // Different tooltip content based on hovered object type
    let content;
    if (hoveredObject.tripId && hoveredObject.startPoint) {
      // Trip path tooltip
      content = (
        <>
          <div><strong>{hoveredObject.name}</strong></div>
          <div>Boat: {hoveredObject.startPoint.boatName || 'Unknown'}</div>
          <div>Start: {new Date(hoveredObject.startPoint.time).toLocaleString()}</div>
          <div>End: {new Date(hoveredObject.endPoint.time).toLocaleString()}</div>
        </>
      );
    } else if (hoveredObject.time) {
      // Point tooltip
      content = (
        <>
          <div><strong>Position</strong></div>
          <div>Time: {new Date(hoveredObject.time).toLocaleString()}</div>
          <div>Speed: {hoveredObject.speed.toFixed(1)} {hoveredObject.speed < 20 ? 'm/s' : 'km/h'}</div>
          <div>Heading: {hoveredObject.heading.toFixed(0)}°</div>
          <div>Boat: {hoveredObject.boatName || 'Unknown'}</div>
        </>
      );
    }

    return (
      <div className="tooltip"
        style={{
          position: 'absolute',
          zIndex: 1000,
          pointerEvents: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '8px',
          borderRadius: '4px',
          left: hoveredObject.x,
          top: hoveredObject.y
        }}>
        {content}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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
        getTooltip={({object}: any) => object && `${object.name || object.boatName || 'Vessel'}`}
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
      {hoveredObject && renderTooltip()}
      
      {/* Reset filter button - only show when a trip is selected */}
      {selectedTripId && (
        <button 
          className="btn btn-sm btn-light position-absolute"
          style={{ top: '10px', right: '10px', zIndex: 100 }}
          onClick={() => onSelectVessel && onSelectVessel(null)}
        >
          Show All Trips
        </button>
      )}
      
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
          <h3 className="card-title mb-2">Speed Legend</h3>
          <div className="mb-2" style={{ height: '20px', background: 'linear-gradient(to right, rgb(68,1,84), rgb(72,40,120), rgb(62,74,137), rgb(49,104,142), rgb(38,130,142), rgb(31,158,137), rgb(53,183,121), rgb(109,205,89), rgb(180,222,44), rgb(253,231,37))' }}></div>
          <div className="d-flex justify-content-between">
            <span>0 km/h</span>
            <span>20 km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishersMap; 