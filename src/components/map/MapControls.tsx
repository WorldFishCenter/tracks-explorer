import React from 'react';
import { IconMapPins, IconGridDots, IconFilterOff, IconSailboat, IconMathMaxMin, IconRefresh} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface MapControlsProps {
  showActivityGrid: boolean;
  onToggleActivityGrid: (show: boolean) => void;
  selectedTripId?: string;
  onClearSelection?: () => void;
  onCenterOnLiveLocations?: () => void;
  liveLocationsCount?: number;
  showBathymetry?: boolean;
  onToggleBathymetry?: (show: boolean) => void;
  bathymetryLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  showActivityGrid,
  onToggleActivityGrid,
  selectedTripId,
  onClearSelection,
  onCenterOnLiveLocations,
  liveLocationsCount = 0,
  showBathymetry = false,
  onToggleBathymetry,
  bathymetryLoading = false,
  onRefresh,
  isRefreshing = false
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Main controls - top right */}
      <div className="position-absolute" style={{ top: '10px', right: '10px', zIndex: 100 }}>
        <div className="d-flex flex-column gap-2">
          {/* Activity Grid Toggle Button with integrated indicator */}
          <div className="btn-group" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
            <button
              className={`btn ${showActivityGrid ? 'btn-outline-light' : 'btn-primary'}`}
              onClick={() => onToggleActivityGrid(false)}
              disabled={!showActivityGrid}
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                opacity: showActivityGrid ? 0.7 : 1,
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px'
              }}
            >
              <IconMapPins size={20} stroke={1.5} />
              <span className="d-none d-md-inline">{t('map.tripTracks')}</span>
            </button>
            <button
              className={`btn ${!showActivityGrid ? 'btn-outline-light' : 'btn-primary'}`}
              onClick={() => onToggleActivityGrid(true)}
              disabled={showActivityGrid}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                opacity: !showActivityGrid ? 0.7 : 1,
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px'
              }}
            >
              <IconGridDots size={20} stroke={1.5} />
              <span className="d-none d-md-inline">{t('common.visitFrequency')}</span>
            </button>
          </div>

          {/* Bathymetry toggle button */}
          {onToggleBathymetry && (
            <button
              className={`btn ${showBathymetry ? 'btn-primary' : 'btn-light'} ${showBathymetry ? '' : 'd-md-none'}`}
              onClick={() => onToggleBathymetry(!showBathymetry)}
              disabled={bathymetryLoading}
              title={t('map.showBathymetry')}
              aria-label={t('map.bathymetry')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                minHeight: '44px',
                position: 'relative',
                opacity: window.innerWidth < 768 ? 0.85 : 1
              }}
            >
              <span>{t('map.bathymetry')}</span>
              {bathymetryLoading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <IconMathMaxMin size={20} stroke={1.5} />
              )}
              <span className="badge bg-yellow text-dark position-absolute top-0 rounded-pill" style={{ fontSize: '0.65rem', right: '-1px', transform: 'translateY(-50%)' }}>
                     NEW
                   </span>
            </button>
          )}

          {/* Reset filter button - only show when a trip is selected */}
          {selectedTripId && onClearSelection && (
            <button
              className="btn btn-light"
              onClick={onClearSelection}
              title={t('common.showAllTrips')}
              aria-label={t('common.showAllTrips')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                minHeight: '44px'
              }}
            >
              <IconFilterOff size={20} stroke={1.5} />
              <span className="d-none d-md-inline">{t('common.showAllTrips')}</span>
            </button>
          )}

          {/* Live Location button - only show when there are live locations */}
          {liveLocationsCount > 0 && onCenterOnLiveLocations && (
            <button
              className="btn btn-danger"
              onClick={onCenterOnLiveLocations}
              title={t('dashboard.centerOnLiveLocations')}
              aria-label={t('dashboard.centerOnLiveLocations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                minHeight: '44px',
                position: 'relative',
                opacity: window.innerWidth < 768 ? 0.85 : 1
              }}
            >
              <IconSailboat size={20} stroke={1.5} />
              <span>{t('dashboard.liveLocation')}</span>
              {liveLocationsCount > 1 && (
                <span className="badge bg-light text-dark position-absolute top-0 end-0" style={{ fontSize: '0.65rem', transform: 'translate(25%, -25%)' }}>
                  {liveLocationsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Refresh button - bottom right, compact */}
      {onRefresh && (
        <div className="position-absolute" style={{ bottom: '10px', right: '10px', zIndex: 100 }}>
          <button
            className={`btn ${isRefreshing ? 'btn-secondary' : 'btn-cyan'}`}
            onClick={onRefresh}
            disabled={isRefreshing}
            title={t('common.refresh')}
            aria-label={t('common.refresh')}
            style={{
              width: '44px',
              height: '44px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              borderRadius: '8px'
            }}
          >
            {isRefreshing ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
            ) : (
              <IconRefresh size={22} stroke={2} />
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default MapControls; 