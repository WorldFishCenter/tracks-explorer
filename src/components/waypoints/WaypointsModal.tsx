import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconX, IconTrash, IconCurrentLocation, IconClick } from '@tabler/icons-react';
import { Waypoint, WaypointFormData, WaypointType, GPSCoordinate } from '../../types';

interface WaypointsModalProps {
  waypoints: Waypoint[];
  onSave: (data: WaypointFormData) => Promise<void>;
  onDelete: (waypointId: string) => Promise<void>;
  onClose: () => void;
  deviceLocation?: GPSCoordinate | null;
  onGetMyLocation?: () => void;
  isGettingLocation?: boolean;
  selectedMapCoordinates?: { lat: number; lng: number } | null;
  onRequestMapClick?: () => void;
  onToggleWaypoint?: (waypointId: string) => void;
  onToggleAllWaypoints?: (visible: boolean) => void;
}

type TabType = 'add' | 'list';

const WaypointsModal: React.FC<WaypointsModalProps> = ({
  waypoints,
  onSave,
  onDelete,
  onClose,
  deviceLocation,
  onGetMyLocation,
  isGettingLocation = false,
  selectedMapCoordinates,
  onRequestMapClick,
  onToggleWaypoint,
  onToggleAllWaypoints
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('add');

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<WaypointType>('favorite_spot');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Theme detection and body scroll lock effect
  useEffect(() => {
    const detectTheme = () => {
      const theme = document.documentElement.getAttribute('data-bs-theme');
      setIsDarkMode(theme === 'dark');
    };

    detectTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
          detectTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme']
    });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      observer.disconnect();
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Update coordinates when selectedMapCoordinates prop changes
  useEffect(() => {
    if (selectedMapCoordinates) {
      setCoordinates(selectedMapCoordinates);
      setActiveTab('add'); // Switch to add tab when coordinates are selected
    }
  }, [selectedMapCoordinates]);

  const handleUseCurrentGPS = () => {
    if (deviceLocation) {
      setCoordinates({ lat: deviceLocation.latitude, lng: deviceLocation.longitude });
    } else if (onGetMyLocation) {
      onGetMyLocation();
    }
  };

  useEffect(() => {
    if (deviceLocation && !coordinates) {
      setCoordinates({ lat: deviceLocation.latitude, lng: deviceLocation.longitude });
    }
  }, [deviceLocation, coordinates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Waypoint name is required');
      return;
    }

    if (!coordinates) {
      setError('Please select a location (use GPS or long-press on map for 3 seconds)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData: WaypointFormData = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        coordinates
      };

      await onSave(formData);

      // Reset form
      setName('');
      setDescription('');
      setCoordinates(null);
      setType('favorite_spot');

      // Switch to list tab to show the new waypoint
      setActiveTab('list');
    } catch (err) {
      console.error('Error saving waypoint:', err);
      setError(err instanceof Error ? err.message : 'Failed to save waypoint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (waypointId: string) => {
    if (!window.confirm('Are you sure you want to delete this waypoint?')) {
      return;
    }

    setDeletingId(waypointId);
    try {
      await onDelete(waypointId);
    } catch (err) {
      console.error('Error deleting waypoint:', err);
      alert('Failed to delete waypoint');
    } finally {
      setDeletingId(null);
    }
  };

  const waypointTypes: { value: WaypointType; label: string; icon: string; color: string }[] = [
    { value: 'port', label: 'Port', icon: 'ti-building', color: 'text-purple' },
    { value: 'anchorage', label: 'Anchorage', icon: 'ti-anchor', color: 'text-info' },
    { value: 'fishing_ground', label: 'Fishing Ground', icon: 'ti-star-filled', color: 'text-success' },
    { value: 'favorite_spot', label: 'Favorite Spot', icon: 'ti-heart-filled', color: 'text-warning' },
    { value: 'other', label: 'Other', icon: 'ti-map-pin-filled', color: 'text-secondary' }
  ];

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Modal */}
      <div
        className="modal modal-blur fade show"
        style={{ display: 'block' }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                <IconMapPin className="me-2" size={24} />
                Waypoints
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Tabs */}
            <div className="card-tabs">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'add' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add')}
                    type="button"
                    role="tab"
                  >
                    <IconMapPin className="me-2" size={18} />
                    Add Waypoint
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                    type="button"
                    role="tab"
                  >
                    My Waypoints
                    {waypoints.length > 0 && (
                      <span className="badge ms-2">{waypoints.length}</span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            {/* Tab Content */}
            <div className="modal-body">
              {/* Add Waypoint Tab */}
              {activeTab === 'add' && (
                <form onSubmit={handleSubmit}>
                  {/* Error message */}
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      <div className="d-flex align-items-center">
                        <IconX className="me-2" size={20} />
                        <div>{error}</div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="alert alert-info mb-3">
                    <div className="d-flex align-items-start">
                      <IconClick className="me-2 mt-1" size={20} />
                      <div>
                        <strong>How to add a waypoint:</strong>
                        <ol className="mb-0 mt-2 ps-3">
                          <li>Use your current GPS location (click button below)</li>
                          <li>Long-press on the map for 3 seconds to select a location</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div className="mb-3">
                    <label className="form-label required">Location</label>
                    <div className="btn-group w-100 mb-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleUseCurrentGPS}
                        disabled={isGettingLocation}
                      >
                        {isGettingLocation ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Getting GPS...
                          </>
                        ) : (
                          <>
                            <IconCurrentLocation className="me-2" size={18} />
                            Use My GPS
                          </>
                        )}
                      </button>
                      {onRequestMapClick && (
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          onClick={onRequestMapClick}
                        >
                          <IconClick className="me-2" size={18} />
                          Click on Map
                        </button>
                      )}
                    </div>
                    {coordinates ? (
                      <div className="card bg-success-lt">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-start">
                              <div className="text-muted small">Latitude</div>
                              <div className="h4 mb-0">{coordinates.lat.toFixed(6)}</div>
                            </div>
                            <div className="text-start">
                              <div className="text-muted small">Longitude</div>
                              <div className="h4 mb-0">{coordinates.lng.toFixed(6)}</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost-danger"
                              onClick={() => setCoordinates(null)}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card bg-secondary-lt">
                        <div className="card-body p-3 text-center text-muted">
                          <IconMapPin size={24} className="mb-2" />
                          <div>No location selected</div>
                          <small>Use GPS or long-press on map</small>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Name field */}
                  <div className="mb-3">
                    <label className="form-label required">Waypoint Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Good tuna spot"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Type field */}
                  <div className="mb-3">
                    <label className="form-label required">Type</label>
                    <select
                      className="form-select"
                      value={type}
                      onChange={(e) => setType(e.target.value as WaypointType)}
                      required
                    >
                      {waypointTypes.map(wt => (
                        <option key={wt.value} value={wt.value}>
                          {wt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description field */}
                  <div className="mb-3">
                    <label className="form-label">Description (optional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Add notes about this location..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting || !name.trim() || !coordinates}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconMapPin className="me-2" size={18} />
                        Save Waypoint
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Waypoints List Tab */}
              {activeTab === 'list' && (
                <div>
                  {waypoints.length === 0 ? (
                    <div className="empty py-5">
                      <div className="empty-icon">
                        <IconMapPin size={48} className="text-muted" />
                      </div>
                      <p className="empty-title">No waypoints yet</p>
                      <p className="empty-subtitle text-muted">
                        Switch to "Add Waypoint" tab to create your first waypoint
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Waypoints List Header with Bulk Controls */}
                      <div className="card-header">
                        <h3 className="card-title">
                          My Waypoints
                          <span className="badge badge-pill ms-2">
                            {waypoints.filter(wp => wp.visible !== false).length}/{waypoints.length}
                          </span>
                        </h3>
                        <div className="card-actions">
                          {onToggleAllWaypoints && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                const allVisible = waypoints.every(wp => wp.visible !== false);
                                onToggleAllWaypoints(!allVisible);
                              }}
                            >
                              {waypoints.every(wp => wp.visible !== false)
                                ? t('waypoints.hideAll', 'Hide All')
                                : t('waypoints.showAll', 'Show All')}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Waypoints List */}
                      <div className="list-group list-group-flush">
                        {waypoints.map((waypoint) => {
                          const typeInfo = waypointTypes.find(t => t.value === waypoint.type) || waypointTypes[3];
                          return (
                            <div
                              key={waypoint._id}
                              className="list-group-item p-3"
                            >
                              <div className="row align-items-center">
                                {/* Visibility Toggle */}
                                {onToggleWaypoint && waypoint._id && (
                                  <div className="col-auto">
                                    <label className="form-check form-switch mb-0">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={waypoint.visible !== false}
                                        onChange={() => onToggleWaypoint(waypoint._id!)}
                                        title={t('waypoints.toggleVisibility', 'Toggle visibility on map')}
                                      />
                                    </label>
                                  </div>
                                )}

                                {/* Icon */}
                                <div className="col-auto">
                                  <i className={`ti ${typeInfo.icon} ${typeInfo.color} icon-lg`}></i>
                                </div>

                                {/* Content */}
                                <div className="col">
                                  <div className="fw-bold">{waypoint.name}</div>
                                  <div className="text-secondary small">
                                    <span className="badge badge-sm bg-secondary-lt me-2">
                                      {typeInfo.label}
                                    </span>
                                    <span className="font-monospace">{waypoint.coordinates.lat.toFixed(4)}, {waypoint.coordinates.lng.toFixed(4)}</span>
                                  </div>
                                  {waypoint.description && (
                                    <div className="text-secondary small mt-1">
                                      {waypoint.description}
                                    </div>
                                  )}
                                </div>

                                {/* Delete Button */}
                                <div className="col-auto">
                                  {waypoint._id && (
                                    <button
                                      className="btn btn-sm btn-ghost-danger"
                                      onClick={() => handleDelete(waypoint._id!)}
                                      disabled={deletingId === waypoint._id}
                                      title="Delete waypoint"
                                    >
                                      {deletingId === waypoint._id ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <IconTrash size={18} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WaypointsModal;
