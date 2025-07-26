import React from 'react';
import { IconAnchor, IconInfoCircle, IconMapPins } from '@tabler/icons-react';
import { LiveLocation, VesselDetails } from '../../types';
import { convertLiveLocationToVesselDetails } from '../../utils/calculations';
import { getBatteryBadgeClass } from '../../utils/colors';
import { formatCoordinates } from '../../utils/formatters';

interface VesselDetailsPanelProps {
  liveLocations: LiveLocation[];
}

const VesselDetailsPanel: React.FC<VesselDetailsPanelProps> = ({ liveLocations }) => {
  if (liveLocations.length === 0) {
    return (
      <div className="card mb-2" style={{ maxHeight: 480, overflowY: 'auto' }}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center mb-3">
            <IconAnchor className="icon me-2 text-primary" />
            <h3 className="card-title m-0">Vessel Details</h3>
          </div>
          <div className="text-center text-muted py-4">
            <IconInfoCircle size={32} className="mb-2 text-muted" />
            <div>No live vessel data available</div>
            <div className="small">Vessel details will appear here when live location data is available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-2" style={{ maxHeight: 480, overflowY: 'auto' }}>
      <div className="card-body p-3">
        <div className="d-flex align-items-center mb-3">
          <IconAnchor className="icon me-2 text-primary" />
          <h3 className="card-title m-0">Vessel Details</h3>
        </div>
        
        {liveLocations.map((location, index) => {
          const vesselDetails = convertLiveLocationToVesselDetails(location);
          
          return (
            <div key={location.imei || index} className="mb-3">
              {/* Vessel Header */}
              <div className="d-flex align-items-center mb-3 p-2 bg-light rounded">
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
                <div className="card mb-3 border-0 bg-light">
                  <div className="card-body p-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-battery-half me-2 text-primary" style={{ fontSize: '1.2em' }} />
                      <div>
                        <div className="fw-bold">Battery Status</div>
                        <span className={`badge ${getBatteryBadgeClass(vesselDetails.batteryState)}`}>
                          {vesselDetails.batteryState}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Known Location */}
              <div className="card mb-3 border-0 bg-light">
                <div className="card-body p-2">
                  <div className="d-flex align-items-center mb-2">
                    <IconMapPins size={18} className="me-2 text-primary" />
                    <h6 className="m-0">Last Known Location</h6>
                  </div>
                  <div className="row g-2">
                    {vesselDetails.coordinates && (
                      <div className="col-12 mb-2">
                        <div className="text-muted small">Coordinates</div>
                        <div className="fw-bold font-monospace">
                          {formatCoordinates(vesselDetails.coordinates.lat, vesselDetails.coordinates.lng)}
                        </div>
                      </div>
                    )}
                    {vesselDetails.lastGpsTime && (
                      <div className="col-6">
                        <div className="text-muted small">Last GPS</div>
                        <div className="fw-bold small">{vesselDetails.lastGpsTime}</div>
                      </div>
                    )}
                    {vesselDetails.lastSeenTime && (
                      <div className="col-6">
                        <div className="text-muted small">Last Seen</div>
                        <div className="fw-bold small">{vesselDetails.lastSeenTime}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Last Update */}
              <div className="text-center p-2 bg-light rounded">
                <div className="text-muted small">Last Update</div>
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