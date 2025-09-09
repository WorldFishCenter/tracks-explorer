import React, { useState, useEffect, useCallback } from 'react';
import Map, { NavigationControl, ScaleControl } from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchTripPoints, getDateRangeForLastDays } from '../api/pelagicDataService';
import { getMapConfig } from '../config/mapConfig';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TripPoint, LiveLocation, ViewState, MobileTooltip, MapProps } from '../types';
import { formatPointsForLayers, calculateCenterFromPoints } from '../utils/mapData';
import { createMapLayers } from './map/MapLayers';
import { createTooltipContent } from './map/MapTooltip';
import MapControls from './map/MapControls';
import MapLegend from './map/MapLegend';
import MobileTooltipComponent from './map/MobileTooltip';
import { useMobileDetection } from '../hooks/useMobileDetection';
import './map/MapStyles.css';

// Get Mapbox token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 39.6, // East Africa coast (Zanzibar area based on sample data)
  latitude: -4.4,
  zoom: 7,
  pitch: 40,
  bearing: 0
};

const FishersMap: React.FC<MapProps> = ({
  onSelectVessel,
  dateFrom,
  dateTo,
  selectedTripId,
  liveLocations = [],
  centerOnLiveLocations = false,
  onCenterOnLiveLocations
}) => {
  const { currentUser } = useAuth();
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [tripById, setTripById] = useState<Record<string, TripPoint[]>>({});
  // Hover functionality can be added back if needed in the future
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const mapConfig = getMapConfig();
  const [mapStyle] = useState(mapConfig.defaultMapStyle);
  const [showActivityGrid, setShowActivityGrid] = useState(false);
  
  // Mobile-friendly tooltip state
  const [mobileTooltip, setMobileTooltip] = useState<MobileTooltip | null>(null);
  const { isMobile } = useMobileDetection();

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
          const center = calculateCenterFromPoints(points);
          setViewState(prevState => ({
            ...prevState,
            latitude: center.latitude,
            longitude: center.longitude,
            zoom: 10
          }));
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
      const center = calculateCenterFromPoints(tripPoints);

      // Set a higher zoom level for selected trips to see details better
      const zoomLevel = 11;

      setViewState({
        longitude: center.longitude,
        latitude: center.latitude,
        zoom: zoomLevel,
        pitch: 40,
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

  // Event handlers
  // Hover handler for map layers
  const handleHover = () => {
    // Currently no-op, hover functionality can be added back if needed
    // This prevents the reference error in createMapLayers
  };

  const handleClick = (info: { object?: TripPoint | LiveLocation | undefined; x: number; y: number; }) => {
    if (isMobile && info.object) {
      
      // Show mobile tooltip on tap with a small delay to ensure stability
      setTimeout(() => {
        setMobileTooltip({
          object: info.object || null,
          x: info.x,
          y: info.y,
          visible: true
        });
      }, 10);
      
    } else if (info.object && onSelectVessel) {
      // Select vessel/trip when clicking on it
      // Check if it's a LiveLocation or TripPoint and handle accordingly
      if ('imei' in info.object) {
        // It's a LiveLocation
        onSelectVessel(info.object as LiveLocation);
      } else {
        // It's a TripPoint - we can't pass it to onSelectVessel directly
        // so pass null to clear selection
        onSelectVessel(null);
      }
    } else if (!info.object && onSelectVessel) {
      // Clear selection when clicking on empty space
      onSelectVessel(null);
    }
  };

  // Create layers
  const layers = createMapLayers({
    filteredTripPoints,
    filteredTripById,
    selectedTripId,
    showActivityGrid,
    liveLocations,
    onHover: handleHover,
    onClick: handleClick
  });

  // Function to center map on live locations
  const centerOnLiveLocationsHandler = useCallback(() => {
    if (liveLocations.length > 0) {
      // Calculate center of all live locations
      const totalLat = liveLocations.reduce((sum, loc) => sum + loc.lat, 0);
      const totalLng = liveLocations.reduce((sum, loc) => sum + loc.lng, 0);
      const avgLat = totalLat / liveLocations.length;
      const avgLng = totalLng / liveLocations.length;
      
      setViewState({
        longitude: avgLng,
        latitude: avgLat,
        zoom: 12, // Closer zoom to see live locations clearly
        pitch: 40,
        bearing: 0
      });
    }
  }, [liveLocations]);

  // Center map on live locations when flag is true
  useEffect(() => {
    if (centerOnLiveLocations && liveLocations.length > 0) {
      centerOnLiveLocationsHandler();
    }
  }, [centerOnLiveLocations, liveLocations, centerOnLiveLocationsHandler]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Add Bootstrap icons CSS for tooltip icons */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css" />
      
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        viewState={viewState}
        onViewStateChange={(evt) => {
          const newViewState = evt.viewState as any;
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
        getTooltip={({object}) => {
          if (!object || isMobile) return null;
          
          const tooltipContent = createTooltipContent({
            object,
            filteredTripById,
            selectedTripId
          });
          
          return tooltipContent ? { html: tooltipContent } : null;
        }}
      >
        <Map
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={mapConfig.showAttribution}
          trackResize={true}
          reuseMaps={false}
        >
          <NavigationControl position="top-left" showCompass={true} showZoom={true} visualizePitch={true} />
          <ScaleControl position="bottom-left" maxWidth={100} unit="metric" />
        </Map>
      </DeckGL>

      {/* Map Controls */}
      <MapControls
        showActivityGrid={showActivityGrid}
        onToggleActivityGrid={setShowActivityGrid}
        selectedTripId={selectedTripId}
        onClearSelection={() => onSelectVessel && onSelectVessel(null)}
        onCenterOnLiveLocations={onCenterOnLiveLocations}
        liveLocationsCount={liveLocations.length}
      />

      {/* Legend */}
      <MapLegend showActivityGrid={showActivityGrid} />

      {/* Mobile Tooltip */}
      {mobileTooltip && mobileTooltip.visible && (
        <MobileTooltipComponent
          tooltip={mobileTooltip}
          onClose={() => setMobileTooltip(null)}
          filteredTripById={filteredTripById}
          selectedTripId={selectedTripId}
        />
      )}
    </div>
  );
};

export default FishersMap; 