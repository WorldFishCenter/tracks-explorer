import React, { Suspense } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LiveLocation, GPSCoordinate, Waypoint } from '../../types';

const FishersMap = React.lazy(() => import('../Map'));

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
  hasTrackingDevice?: boolean;
  deviceLocation?: GPSCoordinate | null;
  onGetMyLocation?: () => void;
  isGettingLocation?: boolean;
  showNoTripsMessage?: boolean;
  waypoints?: Waypoint[];
  onEnterWaypointMode?: () => void;
  onToggleWaypoints?: () => void;
  waypointsCount?: number;
  isWaypointSelectionMode?: boolean;
  onCancelWaypointMode?: () => void;
  onConfirmWaypointLocation?: (coordinates: { lat: number; lng: number }) => void;
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
  isRefreshing = false,
  hasTrackingDevice = true,
  deviceLocation,
  onGetMyLocation,
  isGettingLocation = false,
  showNoTripsMessage = false,
  waypoints = [],
  onEnterWaypointMode,
  onToggleWaypoints,
  waypointsCount,
  isWaypointSelectionMode = false,
  onCancelWaypointMode,
  onConfirmWaypointLocation
}) => {
  const { t } = useTranslation();

  // Dynamic height: larger for non-tracking users since they have less content
  const mapHeight = hasTrackingDevice ? "500px" : "calc(100vh - 200px)";

  return (
    <div className="card mb-2" style={{ height: mapHeight, minHeight: "400px" }}>
      <div className="card-body p-0" style={{ position: "relative", height: "100%" }}>
        {/* Always render the map, but lazy-load its heavy dependencies */}
        <Suspense
          fallback={
            <div 
              className="d-flex justify-content-center align-items-center"
              style={{ height: "100%" }}
            >
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            </div>
          }
        >
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
            hasTrackingDevice={hasTrackingDevice}
            deviceLocation={deviceLocation}
            onGetMyLocation={onGetMyLocation}
            isGettingLocation={isGettingLocation}
            showNoTripsMessage={showNoTripsMessage}
            waypoints={waypoints}
            onEnterWaypointMode={onEnterWaypointMode}
            onToggleWaypoints={onToggleWaypoints}
            waypointsCount={waypointsCount}
            isWaypointSelectionMode={isWaypointSelectionMode}
            onCancelWaypointMode={onCancelWaypointMode}
            onConfirmWaypointLocation={onConfirmWaypointLocation}
          />
        </Suspense>
        
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
      </div>
    </div>
  );
};

export default MapContainer; 
