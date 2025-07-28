import React from 'react';
import { IconX } from '@tabler/icons-react';
import { MobileTooltip as MobileTooltipType, TripPoint, LiveLocation } from '../../types';
import { formatTime, formatSpeed, getDirectionFromHeading, formatCoordinates, formatDuration } from '../../utils/formatters';

interface MobileTooltipProps {
  tooltip: MobileTooltipType;
  onClose: () => void;
  filteredTripById: Record<string, TripPoint[]>;
  selectedTripId?: string;
}

const MobileTooltipComponent: React.FC<MobileTooltipProps> = ({
  tooltip,
  onClose,
  filteredTripById,
  selectedTripId
}) => {
  const { object, x, y } = tooltip;

  const renderLiveLocationContent = (location: LiveLocation) => (
    <>
      <div className="tooltip-header">
        <i className="bi bi-geo-alt-fill"></i>
        Live Location
      </div>
      <div className="tooltip-content">
        <div className="tooltip-row"><span>Vessel:</span> {location.boatName || 'Unknown'}</div>
        <div className="tooltip-row"><span>IMEI:</span> {location.imei}</div>
        <div className="tooltip-row"><span>Coordinates:</span> {formatCoordinates(location.lat, location.lng)}</div>
        <div className="tooltip-row"><span>Last GPS:</span> {location.lastGpsTs ? formatTime(location.lastGpsTs) : 'Never'}</div>
        <div className="tooltip-row"><span>Last Seen:</span> {location.lastSeen ? formatTime(location.lastSeen) : 'Never'}</div>
        {location.batteryState && <div className="tooltip-row"><span>Battery:</span> <span className="badge light">{location.batteryState}</span></div>}
        {location.directCustomerName && <div className="tooltip-row"><span>Community:</span> {location.directCustomerName}</div>}
      </div>
    </>
  );

  const renderTripContent = (tripData: any) => {
    const tripPoints = filteredTripById[tripData.tripId] || [];
    const firstPoint = tripPoints[0];
    const lastPoint = tripPoints[tripPoints.length - 1];
    
    const duration = firstPoint && lastPoint 
      ? formatDuration(new Date(lastPoint.time).getTime() - new Date(firstPoint.time).getTime())
      : 'Unknown';
      
    return (
      <>
        <div className="tooltip-header">
          <i className="bi bi-geo-alt"></i>
          {tripData.name || "Trip"}
        </div>
        <div className="tooltip-content">
          <div className="tooltip-row"><span>Vessel:</span> {firstPoint?.boatName || 'Unknown'}</div>
          {firstPoint && <div className="tooltip-row"><span>Started:</span> {formatTime(new Date(firstPoint.time))}</div>}
          {lastPoint && <div className="tooltip-row"><span>Ended:</span> {formatTime(new Date(lastPoint.time))}</div>}
          <div className="tooltip-row"><span>Duration:</span> {duration}</div>
        </div>
      </>
    );
  };

  const renderPointContent = (point: TripPoint) => (
    <>
      <div className="tooltip-header">
        <i className="bi bi-pin-map"></i>
        GPS Position
      </div>
      <div className="tooltip-content">
        <div className="tooltip-row"><span>Time:</span> {formatTime(new Date(point.time))}</div>
        <div className="tooltip-row"><span>Speed:</span> <span className="badge light">
          {formatSpeed(point.speed)}
        </span></div>
        <div className="tooltip-row"><span>Heading:</span> {point.heading.toFixed(0)}° {getDirectionFromHeading(point.heading)}</div>
        <div className="tooltip-row"><span>Vessel:</span> {point.boatName || 'Unknown'}</div>
        <div className="tooltip-row"><span>Trip ID:</span> {point.tripId || 'Unknown'}</div>
      </div>
    </>
  );

  const renderGridContent = (gridData: any) => {
    const coordinates = gridData.position 
      ? formatCoordinates(gridData.position[1], gridData.position[0])
      : 'Unknown';
      
    return (
      <>
        <div className="tooltip-header">
          <i className="bi bi-grid"></i>
          Visited Location
        </div>
        <div className="tooltip-content">
          <div className="tooltip-row">
            <span>Times visited:</span> <span className="badge primary">{gridData.count}</span>
          </div>
          <div className="tooltip-row"><span>Cell size:</span> 500×500 meters</div>
          {selectedTripId && <div className="tooltip-row"><span>Trip:</span> {selectedTripId}</div>}
        </div>
      </>
    );
  };

  // Determine content based on object type
  let content;
  console.log('MobileTooltip rendering with object:', object);
  
  if (object.imei && object.lat && object.lng) {
    content = renderLiveLocationContent(object as LiveLocation);
  } else if (object.tripId && object.path) {
    content = renderTripContent(object);
  } else if (object.time) {
    content = renderPointContent(object as TripPoint);
  } else if (object.count) {
    content = renderGridContent(object);
  } else {
    console.log('No content determined for object:', object);
    return null;
  }

  return (
    <div 
      className="mobile-tooltip"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
        maxWidth: '300px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <div className="mobile-tooltip-content">
        {content}
      </div>
      <button 
        className="mobile-tooltip-close"
        onClick={onClose}
        aria-label="Close tooltip"
      >
        ×
      </button>
    </div>
  );
};

export default MobileTooltipComponent; 