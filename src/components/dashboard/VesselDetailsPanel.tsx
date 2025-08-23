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
            <div key={location.imei || index} className="card mb-3">
              <div className="card-body">
                {/* Vessel Header */}
                <div className="d-flex align-items-center mb-3">
                  <div 
                    className="avatar avatar-lg me-3" 
                    style={{ backgroundColor: '#ffa726' }}
                  >
                    <IconSailboat size={24} className="text-white" />
                  </div>
                  <div className="flex-fill">
                    <h4 className="card-title mb-1">{vesselDetails.name}</h4>
                    {vesselDetails.imei && (
                      <div className="text-muted font-monospace small">{vesselDetails.imei}</div>
                    )}
                  </div>
                  {vesselDetails.batteryState && (
                    <span className={`badge ${getBatteryBadgeClass(vesselDetails.batteryState)} ms-auto`}>
                      {vesselDetails.batteryState}
                    </span>
                  )}
                </div>

                {/* Location & Status Info */}
                <div className="list-group list-group-flush">
                  {vesselDetails.coordinates && (
                    <div className="list-group-item px-0 py-2">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <IconMapPins size={18} className="text-primary" />
                        </div>
                        <div className="col">
                          <div className="text-muted small">{t('vessel.coordinates')}</div>
                          <div className="fw-bold font-monospace">
                            {formatCoordinates(vesselDetails.coordinates.lat, vesselDetails.coordinates.lng)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="list-group-item px-0 py-2">
                    <div className="row">
                      {vesselDetails.lastGpsTime && (
                        <div className="col-sm-6">
                          <div className="text-muted small">{t('vessel.lastGps')}</div>
                          <div className="fw-bold">{vesselDetails.lastGpsTime}</div>
                        </div>
                      )}
                      {vesselDetails.lastSeenTime && (
                        <div className="col-sm-6">
                          <div className="text-muted small">{t('vessel.lastSeen')}</div>
                          <div className="fw-bold">{vesselDetails.lastSeenTime}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last Update Footer */}
                <div className="card-footer bg-light border-top-0 px-0 py-2 mt-3">
                  <div className="text-center">
                    <div className="text-muted small">{t('vessel.lastUpdate')}</div>
                    <div className="fw-bold text-primary">{vesselDetails.lastUpdate}</div>
                  </div>
                </div>
              </div>

              {index < liveLocations.length - 1 && <div className="mb-3" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VesselDetailsPanel; 