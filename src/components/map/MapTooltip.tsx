import { TripPoint, LiveLocation } from '../../types';
import { formatTime, formatSpeed, getDirectionFromHeading, formatCoordinates, formatDuration, formatLocationTime } from '../../utils/formatters';

interface MapTooltipProps {
  object: any;
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
}

export const createTooltipContent = ({
  object,
  filteredTripById,
  selectedTripId
}: MapTooltipProps): string | null => {
  if (!object) return null;

  // Live location
  if (object.imei && object.lat && object.lng) {
    const location = object as LiveLocation;
    return `
      <div class="tooltip-header">
        <i class="bi bi-geo-alt-fill"></i>
        Live Location
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Vessel:</span> ${location.boatName || 'Unknown'}</div>
        <div class="tooltip-row"><span>IMEI:</span> ${location.imei}</div>
        <div class="tooltip-row"><span>Coordinates:</span> ${formatCoordinates(location.lat, location.lng)}</div>
        <div class="tooltip-row"><span>Last Position:</span> ${location.lastGpsTs ? formatLocationTime(location.lastGpsTs, location.timezone) : 'Never'}</div>
        ${location.batteryState ? `<div class="tooltip-row"><span>Battery:</span> <span class="badge light">${location.batteryState}</span></div>` : ''}
        ${location.directCustomerName ? `<div class="tooltip-row"><span>Community:</span> ${location.directCustomerName}</div>` : ''}
      </div>
    `;
  }

  // Tooltip content varies based on object type
  if (object.tripId && object.path) {
    // Trip path tooltip
    const firstPoint = filteredTripById[object.tripId]?.[0];
    const lastPoint = filteredTripById[object.tripId]?.[filteredTripById[object.tripId]?.length - 1];
    const duration = firstPoint && lastPoint 
      ? formatDuration(new Date(lastPoint.time).getTime() - new Date(firstPoint.time).getTime())
      : 'Unknown';
      
    return `
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
    `;
  } else if (object.time) {
    // Point tooltip
    return `
      <div class="tooltip-header">
        <i class="bi bi-pin-map"></i>
        GPS Position
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row"><span>Time:</span> ${formatTime(new Date(object.time))}</div>
        <div class="tooltip-row"><span>Speed:</span> <span class="badge light">
          ${formatSpeed(object.speed)}
        </span></div>
        <div class="tooltip-row"><span>Heading:</span> ${object.heading.toFixed(0)}° ${getDirectionFromHeading(object.heading)}</div>
        <div class="tooltip-row"><span>Vessel:</span> ${object.boatName || 'Unknown'}</div>
        <div class="tooltip-row"><span>Trip ID:</span> ${object.tripId || 'Unknown'}</div>
      </div>
    `;
  } else if (object.count) {
    // Grid cell tooltip
    const coordinates = object.position 
      ? formatCoordinates(object.position[1], object.position[0])
      : 'Unknown';
      
    return `
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
    `;
  }
  
  return null;
}; 