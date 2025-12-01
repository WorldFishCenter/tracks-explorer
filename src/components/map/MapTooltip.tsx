import { TripPoint, LiveLocation, GPSCoordinate, Waypoint } from '../../types';
import { formatTime, formatSpeed, getDirectionFromHeading, formatCoordinates, formatDuration, formatLocationTime } from '../../utils/formatters';
import { anonymizeBoatName, anonymizeImei, anonymizeText } from '../../utils/demoData';

interface MapTooltipProps {
  object: TripPoint | LiveLocation | GPSCoordinate | Waypoint | { tripId: string; path: number[][]; name?: string } | { count: number; position?: [number, number] } | null;
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
}

// Helper to get waypoint type display name
const getWaypointTypeLabel = (type: string): string => {
  switch (type) {
    case 'anchorage':
      return 'Anchorage';
    case 'productive_ground':
      return 'Productive Ground';
    case 'favorite_spot':
      return 'Favorite Spot';
    case 'other':
    default:
      return 'Other';
  }
};

// Helper to get waypoint icon
const getWaypointIcon = (type: string): string => {
  switch (type) {
    case 'anchorage':
      return 'bi-anchor';
    case 'productive_ground':
      return 'bi-star-fill';
    case 'favorite_spot':
      return 'bi-heart-fill';
    case 'other':
    default:
      return 'bi-pin-map-fill';
  }
};

export const createTooltipContent = ({
  object,
  filteredTripById,
  selectedTripId
}: MapTooltipProps): string | null => {
  if (!object) return null;

  // Waypoint tooltip
  if ('_id' in object && 'coordinates' in object && 'type' in object && '_id' in object) {
    const waypoint = object as Waypoint;
    return `
      <div class="tooltip-header">
        <i class="${getWaypointIcon(waypoint.type)}"></i>
        ${waypoint.name}
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Type:</span> <span class="badge light">${getWaypointTypeLabel(waypoint.type)}</span></div>
        ${waypoint.description ? `<div class="tooltip-row"><span>Notes:</span> ${waypoint.description}</div>` : ''}
        <div class="tooltip-row"><span>Location:</span> ${formatCoordinates(waypoint.coordinates.lat, waypoint.coordinates.lng)}</div>
      </div>
    `;
  }


  // Device location (non-PDS users)
  if ('latitude' in object && 'longitude' in object && 'timestamp' in object) {
    const deviceLoc = object as GPSCoordinate;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timestampDate = deviceLoc.timestamp ? new Date(deviceLoc.timestamp) : null;
    const lastPosition = timestampDate ? formatLocationTime(timestampDate, timezone) : 'Never';

    return `
      <div class="tooltip-header">
        <i class="bi bi-geo-alt-fill"></i>
        My Location
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Coordinates:</span> ${formatCoordinates(deviceLoc.latitude, deviceLoc.longitude)}</div>
        <div class="tooltip-row"><span>Last Position:</span> ${lastPosition}</div>
        ${deviceLoc.accuracy ? `<div class="tooltip-row"><span>Accuracy:</span> <span class="badge light">±${Math.round(deviceLoc.accuracy)}m</span></div>` : ''}
      </div>
    `;
  }

  // Live location (PDS users)
  if ('imei' in object && 'lat' in object && 'lng' in object && object.imei && object.lat && object.lng) {
    const location = object as LiveLocation;
    return `
      <div class="tooltip-header">
        <i class="bi bi-geo-alt-fill"></i>
        My Location
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Vessel:</span> ${anonymizeBoatName(location.boatName || 'Unknown')}</div>
        <div class="tooltip-row"><span>IMEI:</span> ${anonymizeImei(location.imei)}</div>
        <div class="tooltip-row"><span>Coordinates:</span> ${formatCoordinates(location.lat, location.lng)}</div>
        <div class="tooltip-row"><span>Last Position:</span> ${location.lastGpsTs ? formatLocationTime(location.lastGpsTs, location.timezone) : 'Never'}</div>
        ${location.batteryState ? `<div class="tooltip-row"><span>Battery:</span> <span class="badge light">${location.batteryState}</span></div>` : ''}
        ${location.directCustomerName ? `<div class="tooltip-row"><span>Community:</span> ${anonymizeText(location.directCustomerName, 'Demo Community')}</div>` : ''}
      </div>
    `;
  }

  // Tooltip content varies based on object type
  // Check for grid first (to avoid matching with other checks)
  if (object && 'count' in object && !('time' in object)) {
    // Grid cell tooltip
    const gridData = object as { count: number; position?: [number, number] };

    return `
      <div class="tooltip-header">
        <i class="bi bi-grid"></i>
        Visited Location
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row">
          <span>Times visited:</span> <span class="badge primary">${gridData.count}</span>
        </div>
        <div class="tooltip-row"><span>Cell size:</span> 500×500 meters</div>
        ${selectedTripId ? `<div class="tooltip-row"><span>Trip:</span> ${selectedTripId}</div>` : ''}
      </div>
    `;
  } else if ('tripId' in object && 'path' in object && object.tripId && object.path) {
    // Trip path tooltip
    const tripData = object as { tripId: string; path: number[][]; name?: string };
    const firstPoint = filteredTripById[tripData.tripId]?.[0];
    const lastPoint = filteredTripById[tripData.tripId]?.[filteredTripById[tripData.tripId]?.length - 1];
    const duration = firstPoint && lastPoint
      ? formatDuration(new Date(lastPoint.time).getTime() - new Date(firstPoint.time).getTime())
      : 'Unknown';

    return `
      <div class="tooltip-header">
        <i class="bi bi-geo-alt"></i>
        ${tripData.name || "Trip"}
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Vessel:</span> ${anonymizeBoatName(firstPoint?.boatName || 'Unknown')}</div>
        ${firstPoint ? `<div class="tooltip-row"><span>Started:</span> ${formatTime(new Date(firstPoint.time))}</div>` : ''}
        ${lastPoint ? `<div class="tooltip-row"><span>Ended:</span> ${formatTime(new Date(lastPoint.time))}</div>` : ''}
        <div class="tooltip-row"><span>Duration:</span> ${duration}</div>
      </div>
    `;
  } else if (object && 'time' in object && 'latitude' in object && 'longitude' in object && 'speed' in object) {
    // Point tooltip
    const pointData = object as unknown as TripPoint;
    return `
      <div class="tooltip-header">
        <i class="bi bi-pin-map"></i>
        GPS Position
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Time:</span> ${formatTime(new Date(pointData.time))}</div>
        <div class="tooltip-row"><span>Speed:</span> <span class="badge light">
          ${formatSpeed(pointData.speed)}
        </span></div>
        <div class="tooltip-row"><span>Heading:</span> ${pointData.heading.toFixed(0)}° ${getDirectionFromHeading(pointData.heading)}</div>
        <div class="tooltip-row"><span>Vessel:</span> ${anonymizeBoatName(pointData.boatName || 'Unknown')}</div>
        <div class="tooltip-row"><span>Trip ID:</span> ${pointData.tripId || 'Unknown'}</div>
      </div>
    `;
  }
  
  return null;
}; 