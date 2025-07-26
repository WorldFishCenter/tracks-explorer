import React from 'react';
import { IconMapPins, IconGridDots, IconFilterOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface MapControlsProps {
  showActivityGrid: boolean;
  onToggleActivityGrid: (show: boolean) => void;
  selectedTripId?: string;
  onClearSelection?: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  showActivityGrid,
  onToggleActivityGrid,
  selectedTripId,
  onClearSelection
}) => {
  const { t } = useTranslation();

  return (
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
              gap: '0.5rem'
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
              gap: '0.5rem'
            }}
          >
            <IconGridDots size={20} stroke={1.5} />
            <span className="d-none d-md-inline">{t('common.visitFrequency')}</span>
          </button>
        </div>

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
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            <IconFilterOff size={20} stroke={1.5} />
            <span className="d-none d-md-inline">{t('common.showAllTrips')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MapControls; 