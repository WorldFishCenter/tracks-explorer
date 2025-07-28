import React from 'react';
import { IconAnchor, IconInfoCircle, IconMapPins, IconSailboat } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LiveLocation, VesselDetails } from '../../types';
import { convertLiveLocationToVesselDetails } from '../../utils/calculations';
import { getBatteryBadgeClass } from '../../utils/colors';
import { formatCoordinates } from '../../utils/formatters';

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
          >
            <IconSailboat className="icon me-1" />
            {t('dashboard.liveLocation')}
          </button>
        </div>
        
        {liveLocations.map((location, index) => {
          const vesselDetails = convertLiveLocationToVesselDetails(location);
          
          return (
            <div key={location.imei || index} className="mb-3">
              {/* Vessel Header */}
              <div className="d-flex align-items-center mb-3 p-2 bg-secondary-subtle rounded">
                <div style={{ width: 40, height: 40, background: '#ffa726', borderRadius: 6, marginRight: 12 }} />
                <div>
                  <h4 className="m-0 mb-1">{vesselDetails.name}</h4>
                  {vesselDetails.imei && (
                    <div className="text-muted small font-monospace">{vesselDetails.imei}</div>
                  )}
                </div>
              </div>

              {/* Battery Status */}
              {vesselDetails.batteryState && (
                <div className="card mb-3 border-0 bg-secondary-subtle">
                  <div className="card-body p-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-battery-half me-2 text-primary" style={{ fontSize: '1.2em' }} />
                      <div>
                        <div className="fw-bold">{t('vessel.batteryStatus')}</div>
                        <span className={`badge ${getBatteryBadgeClass(vesselDetails.batteryState)}`}>
                          {vesselDetails.batteryState}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Known Location */}
              <div className="card mb-3 border-0 bg-secondary-subtle">
                <div className="card-body p-2">
                  <div className="d-flex align-items-center mb-2">
                    <IconMapPins size={18} className="me-2 text-primary" />
                    <h6 className="m-0">{t('vessel.lastKnownLocation')}</h6>
                  </div>
                  <div className="row g-2">
                    {vesselDetails.coordinates && (
                      <div className="col-12 mb-2">
                        <div className="text-muted small">{t('vessel.coordinates')}</div>
                        <div className="fw-bold font-monospace">
                          {formatCoordinates(vesselDetails.coordinates.lat, vesselDetails.coordinates.lng)}
                        </div>
                      </div>
                    )}
                    {vesselDetails.lastGpsTime && (
                      <div className="col-6">
                        <div className="text-muted small">{t('vessel.lastGps')}</div>
                        <div className="fw-bold small">{vesselDetails.lastGpsTime}</div>
                      </div>
                    )}
                    {vesselDetails.lastSeenTime && (
                      <div className="col-6">
                        <div className="text-muted small">{t('vessel.lastSeen')}</div>
                        <div className="fw-bold small">{vesselDetails.lastSeenTime}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Last Update */}
              <div className="text-center p-2 bg-secondary-subtle rounded">
                <div className="text-muted small">{t('vessel.lastUpdate')}</div>
                <div className="fw-bold">{vesselDetails.lastUpdate}</div>
              </div>

              {index < liveLocations.length - 1 && <hr className="my-3" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VesselDetailsPanel; 