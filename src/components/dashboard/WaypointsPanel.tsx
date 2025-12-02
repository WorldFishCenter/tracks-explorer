import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconEdit, IconTrash } from '@tabler/icons-react';
import { Waypoint } from '../../types';

interface WaypointsPanelProps {
  waypoints: Waypoint[];
  loading: boolean;
  onEditWaypoint?: (waypoint: Waypoint) => void;
  onDeleteWaypoint?: (waypointId: string) => void;
  onAddWaypoint: () => void;
}

const WaypointsPanel: React.FC<WaypointsPanelProps> = ({
  waypoints,
  loading,
  onEditWaypoint,
  onDeleteWaypoint,
  onAddWaypoint
}) => {
  const { t } = useTranslation();

  // Helper to get waypoint type display name
  const getWaypointTypeLabel = (type: string): string => {
    switch (type) {
      case 'port':
        return 'Port';
      case 'anchorage':
        return 'Anchorage';
      case 'fishing_ground':
        return 'Fishing Ground';
      case 'favorite_spot':
        return 'Favorite Spot';
      case 'other':
      default:
        return 'Other';
    }
  };

  // Helper to get waypoint icon
  const getWaypointIcon = (type: string): string => {
    switch (type) {
      case 'port':
        return 'ti ti-building';
      case 'anchorage':
        return 'ti ti-anchor';
      case 'fishing_ground':
        return 'ti ti-star-filled';
      case 'favorite_spot':
        return 'ti ti-heart-filled';
      case 'other':
      default:
        return 'ti ti-map-pin-filled';
    }
  };

  // Helper to get waypoint color
  const getWaypointColor = (type: string): string => {
    switch (type) {
      case 'port':
        return 'text-purple'; // Purple
      case 'anchorage':
        return 'text-info'; // Blue
      case 'fishing_ground':
        return 'text-success'; // Green
      case 'favorite_spot':
        return 'text-warning'; // Gold
      case 'other':
      default:
        return 'text-secondary'; // Gray
    }
  };

  return (
    <div className="card mb-2">
      <div className="card-header">
        <h3 className="card-title">
          <IconMapPin className="me-2" size={20} />
          My Waypoints
        </h3>
        <div className="card-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={onAddWaypoint}
          >
            <IconMapPin size={16} className="me-1" />
            Add
          </button>
        </div>
      </div>
      <div className="card-body p-2">
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading waypoints...</span>
            </div>
            <p className="text-muted small mt-2">Loading waypoints...</p>
          </div>
        ) : waypoints.length === 0 ? (
          <div className="empty py-3">
            <div className="empty-icon">
              <i className="ti ti-map-pin icon-lg text-muted"></i>
            </div>
            <p className="empty-title">No waypoints yet</p>
            <p className="empty-subtitle text-muted small">
              Mark important fishing locations by clicking "Add" above
            </p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {waypoints.map((waypoint) => (
              <div
                key={waypoint._id}
                className="list-group-item list-group-item-action p-2"
              >
                <div className="row align-items-center">
                  <div className="col-auto">
                    <i className={`${getWaypointIcon(waypoint.type)} ${getWaypointColor(waypoint.type)} icon-lg`}></i>
                  </div>
                  <div className="col">
                    <div className="fw-bold">{waypoint.name}</div>
                    <div className="text-muted small">
                      <span className="badge badge-sm bg-secondary-lt me-1">
                        {getWaypointTypeLabel(waypoint.type)}
                      </span>
                      {waypoint.coordinates.lat.toFixed(4)}, {waypoint.coordinates.lng.toFixed(4)}
                    </div>
                    {waypoint.description && (
                      <div className="text-muted small mt-1">
                        {waypoint.description}
                      </div>
                    )}
                  </div>
                  <div className="col-auto">
                    <div className="btn-list">
                      {onEditWaypoint && (
                        <button
                          className="btn btn-sm btn-ghost-secondary"
                          onClick={() => onEditWaypoint(waypoint)}
                          title="Edit waypoint"
                        >
                          <IconEdit size={16} />
                        </button>
                      )}
                      {onDeleteWaypoint && waypoint._id && (
                        <button
                          className="btn btn-sm btn-ghost-danger"
                          onClick={() => onDeleteWaypoint(waypoint._id!)}
                          title="Delete waypoint"
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaypointsPanel;
