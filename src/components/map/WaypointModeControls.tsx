import React from 'react';
import { useTranslation } from 'react-i18next';

interface WaypointModeControlsProps {
  coordinates: { lat: number; lng: number } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Action controls for waypoint selection mode
 * Shows current coordinates and Cancel/Confirm buttons
 */
const WaypointModeControls: React.FC<WaypointModeControlsProps> = ({
  coordinates,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  const formatCoordinate = (value: number): string => {
    return value.toFixed(3);
  };

  return (
    <>
      {/* Instruction badge */}
      <div className="position-absolute" style={{ bottom: '62px', left: '10px', zIndex: 100 }}>
        <span className="badge bg-dark text-white" style={{ opacity: 0.75 }}>
          {t('waypoints.dragToSelect', 'Drag map to select waypoint location')}
        </span>
      </div>

      {/* Control bar */}
      <div className="position-absolute" style={{ bottom: '10px', left: '10px', right: '62px', zIndex: 100 }}>
        <div className="input-group" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)', borderRadius: '8px', height: '44px' }}>
          {coordinates && (
            <input
              type="text"
              className="form-control"
              value={`${formatCoordinate(coordinates.lat)}, ${formatCoordinate(coordinates.lng)}`}
              readOnly
              style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
            />
          )}
          <button className="btn btn-success" type="button" onClick={onConfirm}>
            <span className="d-none d-sm-inline">{t('waypoints.saveLocation', 'Save Location')}</span>
            <span className="d-sm-none">Save</span>
          </button>
          <button className="btn btn-danger" type="button" onClick={onCancel} style={{ minWidth: '60px' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
            <span className="d-none d-sm-inline ms-1">{t('common.cancel', 'Cancel')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default WaypointModeControls;
