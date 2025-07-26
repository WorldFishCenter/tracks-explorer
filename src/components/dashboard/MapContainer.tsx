import React from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import FishersMap from '../Map';
import { TripPoint, LiveLocation } from '../../types';

interface MapContainerProps {
  loading: boolean;
  errorMessage: string | null;
  dataAvailable: boolean | null;
  dateFrom: Date;
  dateTo: Date;
  selectedTripId?: string;
  liveLocations: LiveLocation[];
  centerOnLiveLocations: boolean;
  onSelectVessel: (vessel: any) => void;
  onRetry: () => void;
  onTryWiderDateRange: () => void;
  renderNoImeiDataMessage: () => string;
}

const MapContainer: React.FC<MapContainerProps> = ({
  loading,
  errorMessage,
  dataAvailable,
  dateFrom,
  dateTo,
  selectedTripId,
  liveLocations,
  centerOnLiveLocations,
  onSelectVessel,
  onRetry,
  onTryWiderDateRange,
  renderNoImeiDataMessage
}) => {
  return (
    <div className="card mb-2" style={{ height: "500px" }}>
      <div className="card-body p-0">
        {loading && (
          <div className="empty" style={{ height: "100%" }}>
            <div className="empty-icon">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
            <p className="empty-title">Loading vessel data...</p>
            <p className="empty-subtitle text-muted">
              Please wait while we retrieve your vessel information
            </p>
          </div>
        )}
        
        {errorMessage && !loading && (
          <div className="empty" style={{ height: "100%" }}>
            <div className="empty-icon">
              <IconAlertTriangle size={48} className="text-danger" />
            </div>
            <p className="empty-title">Error loading data</p>
            <p className="empty-subtitle text-muted">
              {errorMessage}
            </p>
            <div className="empty-action">
              <button 
                className="btn btn-primary" 
                onClick={onRetry}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {dataAvailable === false && !loading && !errorMessage && (
          <div className="empty" style={{ height: "100%" }}>
            <div className="empty-icon">
              <IconAlertTriangle size={48} className="text-warning" />
            </div>
            <p className="empty-title">No vessel data found</p>
            <p className="empty-subtitle text-muted">
              {renderNoImeiDataMessage()}
            </p>
            <div className="empty-action">
              <button 
                className="btn btn-primary" 
                onClick={onTryWiderDateRange}
              >
                Try a wider date range
              </button>
            </div>
          </div>
        )}
        
        {!loading && !errorMessage && dataAvailable && (
          <FishersMap 
            onSelectVessel={onSelectVessel} 
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedTripId={selectedTripId}
            liveLocations={liveLocations}
            centerOnLiveLocations={centerOnLiveLocations}
          />
        )}
      </div>
    </div>
  );
};

export default MapContainer; 