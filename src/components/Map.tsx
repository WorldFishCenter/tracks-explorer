import React, { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { useAuth } from '../contexts/AuthContext';
import { fetchTripPoints, TripPoint, getDateRangeForLastDays } from '../api/pelagicDataService';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

const INITIAL_VIEW_STATE = {
  longitude: 39.2, // East Africa coast (Zanzibar area based on sample data)
  latitude: -6.0,
  zoom: 10,
  pitch: 0,
  bearing: 0
};

// Utility function to determine point color based on speed
const getPointColorBySpeed = (speed: number): [number, number, number] => {
  // Green to red gradient based on speed (m/s or km/h)
  // If the speed is already in km/h (our app standard)
  if (speed < 5) return [0, 255, 0]; // Slow - green
  if (speed < 10) return [255, 255, 0]; // Medium - yellow
  return [255, 0, 0]; // Fast - red
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
}

const FishersMap: React.FC<MapProps> = ({ 
  onSelectVessel,
  dateFrom,
  dateTo 
}) => {
  const { currentUser } = useAuth();
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [tripById, setTripById] = useState<Record<string, TripPoint[]>>({});
  const [hoveredObject, setHoveredObject] = useState<any>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

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

  // Convert trip data into deck.gl layers
  const layers = [
    // Trip paths as lines
    new LineLayer({
      id: 'trip-paths',
      data: Object.keys(tripById).map(tripId => {
        const points = tripById[tripId];
        if (points.length < 2) return null;
        
        return {
          tripId,
          name: `Trip ${tripId} - ${points[0].boatName || 'Vessel'}`,
          points,
          color: [0, 100, 200],
          startPoint: points[0],
          endPoint: points[points.length - 1]
        };
      }).filter(Boolean),
      getSourcePosition: d => [d.startPoint.longitude, d.startPoint.latitude],
      getTargetPosition: d => [d.endPoint.longitude, d.endPoint.latitude],
      getColor: d => d.color,
      getWidth: 2,
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
      data: tripPoints,
      getPosition: (d: TripPoint) => [d.longitude, d.latitude],
      getColor: (d: TripPoint) => {
        return getPointColorBySpeed(d.speed);
      },
      getRadius: 50,
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
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          mapboxAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
      {hoveredObject && renderTooltip()}
    </div>
  );
};

export default FishersMap; 