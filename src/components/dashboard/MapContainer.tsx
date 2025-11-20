import React from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import FishersMap from '../Map';
import { LiveLocation } from '../../types';

interface MapContainerProps {
  loading: boolean;
  errorMessage: string | null;
  dataAvailable: boolean | null;
  dateFrom: Date;
  dateTo: Date;
  selectedTripId?: string;
  liveLocations: LiveLocation[];
  centerOnLiveLocations: boolean;
  onSelectVessel: (vessel: LiveLocation | null) => void;
  onRetry: () => void;
  onTryWiderDateRange: () => void;
  renderNoImeiDataMessage: () => string;
  isViewingLiveLocations?: boolean;
  onCenterOnLiveLocations?: () => void;
  isAdminMode?: boolean;
  adminHasNoVesselsSelected?: boolean;
  onShowVesselSelection?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
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
  renderNoImeiDataMessage,
  isViewingLiveLocations = false,
  onCenterOnLiveLocations,
  isAdminMode = false,
  adminHasNoVesselsSelected = false,
  onShowVesselSelection,
  onRefresh,
  isRefreshing = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="card mb-2" style={{ height: "500px" }}>
      <div className="card-body p-0" style={{ position: "relative", height: "100%" }}>
        {/* Always render the map */}
        <FishersMap
          onSelectVessel={onSelectVessel}
          dateFrom={dateFrom}
          dateTo={dateTo}
          selectedTripId={selectedTripId}
          liveLocations={liveLocations}
          centerOnLiveLocations={centerOnLiveLocations}
          onCenterOnLiveLocations={onCenterOnLiveLocations}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        
        {/* Admin mode vessel selection overlay */}
        {isAdminMode && adminHasNoVesselsSelected && !loading && (
          <div 
            className="empty" 
            style={{ 
              height: "100%", 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              zIndex: 1000
            }}
          >
            <div className="empty-icon">
              <i className="ti ti-users-group text-primary" style={{ fontSize: '3rem' }}></i>
            </div>
            <p className="empty-title">Administrator Mode</p>
            <p className="empty-subtitle text-muted">
              Select a vessel to view its tracking data and trips
            </p>
            <div className="empty-action">
              <button 
                className="btn btn-primary" 
                onClick={onShowVesselSelection}
                style={{ minHeight: '44px' }}
              >
                <i className="ti ti-ship me-2"></i>
                Choose Vessel
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div 
            className="empty" 
            style={{ 
              height: "100%", 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              zIndex: 1000
            }}
          >
            <div className="empty-icon">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            </div>
            <p className="empty-title">{t('common.loadingVesselData')}</p>
            <p className="empty-subtitle text-muted">
              {t('common.pleaseWaitWhileWeRetrieve')}
            </p>
          </div>
        )}
        
        {/* Error overlay */}
        {errorMessage && !loading && (
          <div 
            className="empty" 
            style={{ 
              height: "100%", 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              zIndex: 1000
            }}
          >
            <div className="empty-icon">
              <IconAlertTriangle size={48} className="text-danger" />
            </div>
            <p className="empty-title">{t('common.errorLoadingData')}</p>
            <p className="empty-subtitle text-muted">
              {errorMessage}
            </p>
            <div className="empty-action">
              <button 
                className="btn btn-primary" 
                onClick={onRetry}
                style={{ minHeight: '44px' }}
              >
                {t('common.tryAgain')}
              </button>
            </div>
          </div>
        )}
        
        {/* No data overlay - muted background */}
        {dataAvailable === false && !loading && !errorMessage && !isViewingLiveLocations && (
          <div 
            className="empty" 
            style={{ 
              height: "100%", 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 1000
            }}
          >
            <div className="empty-icon">
              <IconAlertTriangle size={48} className="text-warning" />
            </div>
            <p className="empty-title text-white">{t('common.noVesselDataFound')}</p>
            <p className="empty-subtitle text-light">
              {renderNoImeiDataMessage()}
            </p>
            <div className="empty-action">
              <button 
                className="btn btn-primary" 
                onClick={onTryWiderDateRange}
                style={{ minHeight: '44px' }}
              >
                {t('common.tryWiderDateRange')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapContainer; 