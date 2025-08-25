import React from 'react';
import { IconAnchor, IconInfoCircle, IconMapPins, IconSailboat, IconClock, IconBattery } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LiveLocation } from '../../types';
import { getBatteryBadgeClass } from '../../utils/colors';
import { formatCoordinates, formatLocationTime } from '../../utils/formatters';

interface VesselDetailsPanelProps {
  liveLocations: LiveLocation[];
  onCenterOnLiveLocations: () => void;
}

const VesselDetailsPanel: React.FC<VesselDetailsPanelProps> = ({ liveLocations, onCenterOnLiveLocations }) => {
  const { t } = useTranslation();
  if (liveLocations.length === 0) {
    return (
      <div className="card mb-2" style={{ maxHeight: 480, overflowY: 'auto' }}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <IconAnchor className="icon me-2 text-primary" />
              <h3 className="card-title m-0">{t('dashboard.vesselDetails')}</h3>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={onCenterOnLiveLocations}
              title={t('dashboard.centerOnLiveLocations')}
              style={{ minHeight: '44px' }}
            >
              <IconSailboat className="icon me-1" />
              {t('dashboard.liveLocation')}
            </button>
          </div>
          <div className="text-center text-muted py-4">
            <IconInfoCircle size={32} className="mb-2 text-muted" />
            <div>{t('dashboard.noData')}</div>
            <div className="small">{t('dashboard.noDataMessage')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-2" style={{ maxHeight: 480, overflowY: 'auto' }}>
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <IconAnchor className="icon me-2 text-primary" />
            <h3 className="card-title m-0">{t('dashboard.vesselDetails')}</h3>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={onCenterOnLiveLocations}
            title={t('dashboard.centerOnLiveLocations')}
            style={{ minHeight: '44px' }}
          >
            <IconSailboat className="icon me-1" />
            {t('dashboard.liveLocation')}
          </button>
        </div>
        
        {liveLocations.map((location, index) => {
          return (
            <div key={location.imei || index} className="card">
              <div className="card-body p-3">
                {/* Clean vessel header */}
                <div className="d-flex align-items-center mb-3">
                  <div className="flex-fill min-width-0">
                    <div className="fw-bold text-truncate">{location.boatName || 'Unknown Vessel'}</div>
                    {location.directCustomerName && (
                      <div className="text-muted small text-truncate">{location.directCustomerName}</div>
                    )}
                  </div>
                  {location.batteryState && (
                    <div className="ms-2">
                      <span className={`badge d-flex align-items-center ${getBatteryBadgeClass(location.batteryState)}`}>
                        <IconBattery size={12} className="me-1" />
                        {location.batteryState}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info grid - mobile optimized */}
                <div className="row g-2">
                  {/* Coordinates */}
                  <div className="col-12">
                  <div className="d-flex align-items-center p-2 bg-primary-subtle rounded border border-primary-muted">
                  <IconMapPins size={16} className="text-primary me-2" />
                      <div className="flex-fill">
                        <div className="small text-muted mb-1">{t('vessel.coordinates')}</div>
                        <div className="font-monospace small fw-bold">
                          {formatCoordinates(location.lat, location.lng)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Position */}
                  <div className="col-12">
                    <div className="d-flex align-items-center p-2 bg-primary-subtle rounded border border-primary-muted">
                      <IconClock size={16} className="text-primary me-2" />
                      <div className="flex-fill">
                        <div className="small text-muted mb-1">{t('vessel.lastPosition')}</div>
                        <div className="fw-bold">
                          {location.lastGpsTs ? formatLocationTime(location.lastGpsTs, location.timezone) : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VesselDetailsPanel; 