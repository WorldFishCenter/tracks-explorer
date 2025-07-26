import React from 'react';
import { IconSailboat } from '@tabler/icons-react';
import { LiveLocation } from '../../types';

interface LiveLocationButtonProps {
  liveLocations: LiveLocation[];
  onCenterOnLiveLocations: () => void;
}

const LiveLocationButton: React.FC<LiveLocationButtonProps> = ({ 
  liveLocations, 
  onCenterOnLiveLocations 
}) => {
  return (
    <div className="card mb-2">
      <div className="card-body p-2">
        <div className="d-flex align-items-center mb-2">
          <IconSailboat className="icon me-2 text-primary" />
          <h3 className="card-title m-0">Live Locations</h3>
        </div>
        <button
          className="btn btn-danger w-100"
          onClick={onCenterOnLiveLocations}
        >
          <IconSailboat className="icon me-2" />
          Last Location ({liveLocations.length})
        </button>
        <div className="text-muted small mt-1">
          {liveLocations.length > 0 
            ? `Click to center map on ${liveLocations.length} live vessel location${liveLocations.length > 1 ? 's' : ''}`
            : 'No live locations available'
          }
        </div>
      </div>
    </div>
  );
};

export default LiveLocationButton; 