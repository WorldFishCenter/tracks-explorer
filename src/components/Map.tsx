import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map from 'react-map-gl';
import type { Map as MapboxMap } from 'mapbox-gl';
import DeckGL from '@deck.gl/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchTripPoints, getDateRangeForLastDays } from '../api/pelagicDataService';
import { getMapConfig } from '../config/mapConfig';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TripPoint, LiveLocation, ViewState, MobileTooltip, MapProps, TripPath, Waypoint } from '../types';
import { formatPointsForLayers, calculateCenterFromPoints } from '../utils/mapData';
import { createMapLayers } from './map/MapLayers';
import { createTooltipContent } from './map/MapTooltip';
import MapControls from './map/MapControls';
import MapLegend from './map/MapLegend';
import MobileTooltipComponent from './map/MobileTooltip';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { useTranslation } from 'react-i18next';
import './map/MapStyles.css';

// Get Mapbox token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 39.61, // East Africa coast (Zanzibar area based on sample data)
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
  onCenterOnLiveLocations,
  onRefresh,
  isRefreshing = false,
  hasTrackingDevice = true,
  deviceLocation,
  onGetMyLocation,
  isGettingLocation = false,
  showNoTripsMessage = false,
  waypoints = [],
  onMapClick,
  onToggleWaypoints,
  waypointsCount
}) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [tripById, setTripById] = useState<Record<string, TripPoint[]>>({});
  // Hover functionality can be added back if needed in the future
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const mapConfig = getMapConfig();
  const [mapStyle] = useState(mapConfig.defaultMapStyle);
  const [showActivityGrid, setShowActivityGrid] = useState(false);
  const [showBathymetry, setShowBathymetry] = useState(false);
  const [bathymetryLoading, setBathymetryLoading] = useState(false);
  const mapRef = useRef<MapboxMap | null>(null);

  // Mobile-friendly tooltip state
  const [mobileTooltip, setMobileTooltip] = useState<MobileTooltip | null>(null);
  const { isMobile } = useMobileDetection();

  // Long-press state for waypoint selection
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressStart, setLongPressStart] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const LONG_PRESS_DURATION = 3000; // 3 seconds
  const MOVEMENT_THRESHOLD = 15; // pixels

  // Fetch trip points data for the current user (only if they have tracking device)
  useEffect(() => {
    const loadTripPoints = async () => {
      if (!currentUser) return;

      // Skip loading trip points for users without tracking devices
      if (!hasTrackingDevice) {
        console.log('User has no tracking device, skipping trip points load');
        setTripPoints([]);
        setTripById({});
        return;
      }

      try {
        // Always use the user's IMEIs, regardless of role
        const imeis = currentUser.imeis;

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
  }, [currentUser, dateFrom, dateTo, hasTrackingDevice]);

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

  // Cleanup long-press timer on unmount or when dependencies change
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [longPressTimer]);

  // Long-press handlers
  const cancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setLongPressStart(null);
    setLongPressProgress(0);
    longPressStartPos.current = null;
  }, [longPressTimer]);

  // Native touch event handlers for long-press (avoids DeckGL drag events that block scrolling)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only process if we have onMapClick callback
    if (!onMapClick) return;

    // DON'T call preventDefault - let scrolling work normally
    const touch = e.touches[0];
    if (!touch) return;

    const x = touch.clientX;
    const y = touch.clientY;

    // Store starting position
    longPressStartPos.current = { x, y };
    setLongPressStart({ x, y, lat: 0, lng: 0 }); // Will get coordinates on completion

    // Start progress animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setLongPressProgress(progress);

      if (elapsed >= LONG_PRESS_DURATION) {
        clearInterval(progressInterval);
      }
    }, 50);

    // Store interval ref for cleanup
    progressIntervalRef.current = progressInterval;

    // Set timer for long-press completion
    const timer = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Get map coordinates at touch point
      if (mapRef.current) {
        const point = mapRef.current.unproject([x, y]);
        const lat = point.lat;
        const lng = point.lng;

        if (onMapClick) {
          onMapClick({ lat, lng });
        }
      }

      cancelLongPress();
    }, LONG_PRESS_DURATION);

    setLongPressTimer(timer);
  }, [onMapClick, LONG_PRESS_DURATION, cancelLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Check if user has moved beyond threshold - if so, cancel long-press
    if (longPressStartPos.current && e.touches[0]) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - longPressStartPos.current.x;
      const deltaY = touch.clientY - longPressStartPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > MOVEMENT_THRESHOLD) {
        // User is scrolling, cancel long-press
        cancelLongPress();
      }
    }
  }, [MOVEMENT_THRESHOLD, cancelLongPress]);

  const handleTouchEnd = useCallback(() => {
    // Cancel long-press if finger is lifted before duration completes
    cancelLongPress();
  }, [cancelLongPress]);

  // Event handlers
  // Hover handler for map layers
  const handleHover = () => {
    // Currently no-op, hover functionality can be added back if needed
    // This prevents the reference error in createMapLayers
  };

  const handleClick = (info: { object?: TripPoint | LiveLocation | TripPath | Waypoint | undefined; x: number; y: number; coordinate?: [number, number]; }) => {
    // Don't process clicks if long-press is active
    if (longPressStart) {
      return;
    }

    // Handle mobile tooltips
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
      if ('imei' in info.object && 'lat' in info.object) {
        // It's a LiveLocation
        onSelectVessel(info.object as LiveLocation);
      } else if ('_id' in info.object && 'coordinates' in info.object) {
        // It's a Waypoint - don't select vessel, just show tooltip
        // Do nothing here, tooltip will show
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
    deviceLocation,
    waypoints,
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

  // Center map on device location when obtained (for non-PDS users)
  useEffect(() => {
    if (deviceLocation) {
      setViewState({
        longitude: deviceLocation.longitude,
        latitude: deviceLocation.latitude,
        zoom: 12, // Same zoom as live locations
        pitch: 40,
        bearing: 0
      });
    }
  }, [deviceLocation]);

  // Bathymetry layer management with vector tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'bathymetry-source';
    const lineLayerId = 'bathymetry-lines';
    const labelLayerId = 'bathymetry-labels';

    const addBathymetryLayers = async () => {
      if (showBathymetry) {
        // Show loading indicator
        setBathymetryLoading(true);

        try {
          // Add GeoJSON source if it doesn't exist
          if (!map.getSource(sourceId)) {
            console.log('Loading bathymetry GeoJSON...');

            // Use fetch with progress for better UX
            const response = await fetch('/bathymetry/bathymetry_contours_wio.geojson');
            const data = await response.json();

            map.addSource(sourceId, {
              type: 'geojson',
              data: data,
              // Performance optimizations
              tolerance: 0.375, // Simplify geometry at lower zooms (default is 0.375)
              buffer: 128 // Tile buffer for smooth panning
            });
          }

          // Add line layer if it doesn't exist
          if (!map.getLayer(lineLayerId)) {
            map.addLayer({
              id: lineLayerId,
              type: 'line',
              source: sourceId,
              // No source-layer needed for GeoJSON
              minzoom: 4,
              maxzoom: 22, // Allow rendering at all zooms
              paint: {
                'line-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'depth_m'],
                  0, '#a6cee3',
                  50, '#1f78b4',
                  100, '#3182bd',
                  200, '#08519c',
                  500, '#54278f'
                ],
                'line-width': [
                  'match',
                  ['get', 'depth_m'],
                  [5, 10, 20, 50, 100, 200, 500], 2,
                  1
                ],
                'line-opacity': 0.7
              },
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              }
            });
          }

          // Add label layer for key depths
          if (!map.getLayer(labelLayerId)) {
            map.addLayer({
              id: labelLayerId,
              type: 'symbol',
              source: sourceId,
              // No source-layer needed for GeoJSON
              minzoom: 8,
              maxzoom: 22, // Allow rendering at all zooms
              filter: [
                'in',
                ['get', 'depth_m'],
                ['literal', [5, 10, 20, 50, 100, 200, 500]]
              ],
              layout: {
                'text-field': ['get', 'depth_label'],
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-size': 12,
                'text-anchor': 'center',
                'symbol-placement': 'line',
                'symbol-spacing': 150,
                'text-padding': 5,
                'text-max-angle': 45,
                'text-allow-overlap': false,
                'text-ignore-placement': false
              },
              paint: {
                'text-color': '#08519c',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2,
                'text-halo-blur': 0.5
              }
            });
          }
        } catch (error) {
          console.error('Error adding bathymetry layers:', error);
        } finally {
          // Hide loading indicator
          setBathymetryLoading(false);
        }
      } else {
        // Remove layers when toggled off (keep data cached)
        if (map.getLayer(labelLayerId)) {
          map.removeLayer(labelLayerId);
        }
        if (map.getLayer(lineLayerId)) {
          map.removeLayer(lineLayerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        setBathymetryLoading(false);
      }
    };

    addBathymetryLayers();
  }, [showBathymetry]);

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onTouchStart={isMobile && onMapClick ? handleTouchStart : undefined}
      onTouchMove={isMobile && onMapClick ? handleTouchMove : undefined}
      onTouchEnd={isMobile && onMapClick ? handleTouchEnd : undefined}
      onTouchCancel={isMobile && onMapClick ? handleTouchEnd : undefined}
    >
      {/* Add Bootstrap icons CSS for tooltip icons */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css" />

      <DeckGL
        viewState={viewState}
        onViewStateChange={(evt) => {
          const newViewState = evt.viewState as ViewState;
          setViewState({
            longitude: newViewState.longitude,
            latitude: newViewState.latitude,
            zoom: newViewState.zoom,
            pitch: newViewState.pitch || 0,
            bearing: newViewState.bearing || 0
          });
        }}
        controller={{
          touchRotate: false,
          scrollZoom: true,
          doubleClickZoom: true,
          keyboard: false
        }}
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
          ref={(ref) => { mapRef.current = ref?.getMap() || null; }}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={mapConfig.showAttribution}
          trackResize={true}
          reuseMaps={false}
        />
      </DeckGL>

      {/* Map Controls */}
      <MapControls
        showActivityGrid={showActivityGrid}
        onToggleActivityGrid={setShowActivityGrid}
        selectedTripId={selectedTripId}
        onClearSelection={() => onSelectVessel && onSelectVessel(null)}
        onCenterOnLiveLocations={onCenterOnLiveLocations}
        liveLocationsCount={liveLocations.length}
        showBathymetry={showBathymetry}
        onToggleBathymetry={setShowBathymetry}
        bathymetryLoading={bathymetryLoading}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        hasTrackingDevice={hasTrackingDevice}
        deviceLocation={deviceLocation}
        onGetMyLocation={onGetMyLocation}
        isGettingLocation={isGettingLocation}
        onToggleWaypoints={onToggleWaypoints}
        waypointsCount={waypointsCount}
      />

      {/* Bathymetry Loading Indicator */}
      {bathymetryLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '20px 30px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ fontSize: '14px', color: '#495057', fontWeight: 500 }}>
            Loading bathymetry data...
          </div>
        </div>
      )}

      {/* Long-press visual indicator */}
      {longPressStart && (
        <div
          style={{
            position: 'absolute',
            left: `${longPressStart.x}px`,
            top: `${longPressStart.y}px`,
            width: '80px',
            height: '80px',
            marginLeft: '-40px',
            marginTop: '-40px',
            borderRadius: '50%',
            border: '4px solid #206bc4',
            backgroundColor: 'rgba(32, 107, 196, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'transform 0.05s ease-out'
          }}
        >
          {/* Progress circle */}
          <svg
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '80px',
              height: '80px',
              transform: 'rotate(-90deg)'
            }}
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#206bc4"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - longPressProgress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>

          {/* Center dot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '12px',
              height: '12px',
              marginLeft: '-6px',
              marginTop: '-6px',
              borderRadius: '50%',
              backgroundColor: '#206bc4'
            }}
          />

          {/* Progress text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, 20px)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#206bc4',
              whiteSpace: 'nowrap',
              textShadow: '0 0 3px white, 0 0 3px white'
            }}
          >
            {Math.round(longPressProgress)}%
          </div>
        </div>
      )}

      {/* No Trips Message - responsive positioning */}
      {hasTrackingDevice && showNoTripsMessage && (
        <>
          {/* Desktop: top center */}
          <div 
            className="card border-0 shadow-sm d-none d-md-block" 
            style={{ 
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              backgroundColor: 'rgba(var(--tblr-body-bg-rgb), 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              maxWidth: '320px',
              width: 'auto'
            }}
          >
            <div 
              className="card-body p-2 d-flex align-items-center gap-2"
              style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-danger" style={{ flexShrink: 0 }}>
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 9v4" />
                <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                <path d="M12 16h.01" />
              </svg>
              <span className="text-danger">{t('map.noTripsShort')}</span>
            </div>
          </div>

          {/* Mobile: bottom center, above refresh button */}
          <div 
            className="card border-0 shadow-sm d-md-none" 
            style={{ 
              position: 'absolute',
              bottom: onRefresh ? '64px' : '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              backgroundColor: 'rgba(var(--tblr-body-bg-rgb), 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              maxWidth: 'calc(100% - 20px)',
              width: 'auto'
            }}
          >
            <div 
              className="card-body p-2 d-flex align-items-center gap-2"
              style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-danger" style={{ flexShrink: 0 }}>
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 9v4" />
                <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                <path d="M12 16h.01" />
              </svg>
              <span className="text-danger">{t('map.noTripsShort')}</span>
            </div>
          </div>
        </>
      )}

      {/* Legend */}
      <MapLegend showActivityGrid={showActivityGrid} hasTrackingDevice={hasTrackingDevice} />

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
