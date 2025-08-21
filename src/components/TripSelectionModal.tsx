import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconFish, IconCalendar, IconClock, IconMapPin, IconLoader, IconBolt, IconWeight, IconList, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { Trip, FishGroup, CatchEventFormData } from '../types';
import { formatTripDate, formatTripDateTime, getTripDayLabel } from '../utils/formatters';
import { format, subDays } from 'date-fns';
import { fetchTrips } from '../api/pelagicDataService';
import { useAuth } from '../contexts/AuthContext';
import { submitCatchEvent } from '../api/catchEventsService';

interface TripSelectionModalProps {
  onSelectTrip: (trip: Trip) => void;
  onClose: () => void;
  onImmediateCatchSuccess?: () => void;
}

const FISH_GROUPS: FishGroup[] = [
  'reef fish',
  'sharks/rays', 
  'small pelagics',
  'large pelagics',
  'tuna/tuna-like'
];

interface TripsByDay {
  [dayLabel: string]: Trip[];
}

const TripSelectionModal: React.FC<TripSelectionModalProps> = ({ onSelectTrip, onClose, onImmediateCatchSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  // State for recent trips
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Immediate catch state
  const [showImmediateCatch, setShowImmediateCatch] = useState(false);
  const [immediateCatchLoading, setImmediateCatchLoading] = useState(false);
  const [immediateCatchError, setImmediateCatchError] = useState<string | null>(null);
  const [immediateCatchSuccess, setImmediateCatchSuccess] = useState(false);
  const [immediateCatchData, setImmediateCatchData] = useState<CatchEventFormData>(() => ({
    tripId: `standalone_${Date.now()}`,
    date: new Date(),
    fishGroup: 'reef fish',
    quantity: 0
  }));

  // Fetch trips from the last 5 days
  useEffect(() => {
    const fetchRecentTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const today = new Date();
        const fiveDaysAgo = subDays(today, 5);
        
        const trips = await fetchTrips({
          dateFrom: fiveDaysAgo,
          dateTo: today,
          imeis: currentUser?.imeis || [],
          includeDeviceInfo: false,
          includeLastSeen: false
        });
        
        setRecentTrips(trips);
      } catch (err) {
        console.error('Error fetching recent trips:', err);
        setError(err instanceof Error ? err.message : 'Error fetching trips');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.imeis) {
      fetchRecentTrips();
    }
  }, [currentUser]);

  // Group trips by day with intuitive labels
  const tripsByDay = useMemo(() => {
    const grouped: TripsByDay = {};
    
    // Sort trips by start time (newest first)
    const sortedTrips = [...recentTrips].sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    
    sortedTrips.forEach(trip => {
      const dayLabel = getTripDayLabel(trip.startTime, t);
      if (!grouped[dayLabel]) {
        grouped[dayLabel] = [];
      }
      grouped[dayLabel].push(trip);
    });
    
    return grouped;
  }, [recentTrips, t]);

  const formatTripTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  const getDurationLabel = (durationSeconds: number) => {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Immediate catch handlers
  const handleImmediateCatchToggle = () => {
    setShowImmediateCatch(!showImmediateCatch);
    setImmediateCatchError(null);
  };

  const handleFishGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setImmediateCatchData(prev => ({ ...prev, fishGroup: e.target.value as FishGroup }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setImmediateCatchData(prev => ({ ...prev, quantity: value }));
  };

  const handleImmediateCatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.imeis?.[0]) {
      setImmediateCatchError(t('catch.errorNoImei'));
      return;
    }

    if (immediateCatchData.quantity <= 0) {
      setImmediateCatchError(t('catch.errorInvalidQuantity'));
      return;
    }

    setImmediateCatchLoading(true);
    setImmediateCatchError(null);

    try {
      await submitCatchEvent(immediateCatchData, currentUser.imeis[0]);
      setImmediateCatchSuccess(true);
      
      // Show success message for 2 seconds then close modal
      setTimeout(() => {
        onImmediateCatchSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting immediate catch report:', err);
      setImmediateCatchError(err instanceof Error ? err.message : t('catch.errorSubmitting'));
    } finally {
      setImmediateCatchLoading(false);
    }
  };

  if (immediateCatchSuccess) {
    return (
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <div className="text-success mb-3">
                <IconCheck size={48} />
              </div>
              <h3 className="text-success">{t('catch.reportSubmitted')}</h3>
              <p className="text-muted">{t('catch.reportSubmittedMessage')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <IconFish className="me-2" size={24} />
              {t('catch.reportCatch')}
            </h3>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {/* Quick Catch Section */}
            <div className="card mb-4" style={{ borderColor: '#f59e0b', backgroundColor: '#fffbf0' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center flex-grow-1">
                    <div className="avatar avatar-sm me-3" style={{ backgroundColor: '#f59e0b' }}>
                      <IconFish size={20} color="white" />
                    </div>
                    <div className="flex-grow-1">
                      <p className="mb-1 fw-medium">{t('catch.quickCatchReport')}</p>
                      <p className="text-muted mb-0 small">{t('catch.noTripNeeded')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleImmediateCatchToggle}
                    disabled={immediateCatchLoading}
                  >
                    <IconFish size={16} className="me-1" />
                    {showImmediateCatch ? t('common.close') : t('catch.startReport')}
                  </button>
                </div>

                {showImmediateCatch && (
                  <>
                    {immediateCatchError && (
                      <div className="alert alert-danger mb-3">
                        <div className="d-flex">
                          <div>
                            <IconAlertTriangle className="me-2" />
                          </div>
                          <div>{immediateCatchError}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <form onSubmit={handleImmediateCatchSubmit}>
                      <div className="row">
                        <div className="col-12 col-md-6">
                          <div className="mb-3">
                            <label className="form-label small">
                              <IconList className="me-1" size={14} />
                              {t('catch.fishGroup')}
                            </label>
                            <select
                              className="form-select"
                              value={immediateCatchData.fishGroup}
                              onChange={handleFishGroupChange}
                              disabled={immediateCatchLoading}
                              required
                            >
                              {FISH_GROUPS.map(group => (
                                <option key={group} value={group}>
                                  {t(`catch.fishGroups.${group.replace(/[^a-zA-Z]/g, '')}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="mb-3">
                            <label className="form-label small">
                              <IconWeight className="me-1" size={14} />
                              {t('catch.quantity')} (kg)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={immediateCatchData.quantity || ''}
                              onChange={handleQuantityChange}
                              placeholder="0"
                              min="0"
                              step="0.1"
                              disabled={immediateCatchLoading}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleImmediateCatchToggle}
                          disabled={immediateCatchLoading}
                          style={{ minWidth: '100px' }}
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="btn btn-warning"
                          disabled={immediateCatchLoading || immediateCatchData.quantity <= 0}
                          style={{ minWidth: '140px' }}
                        >
                          {immediateCatchLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              {t('common.loading')}...
                            </>
                          ) : (
                            <>
                              <IconCheck className="me-1" size={16} />
                              {t('catch.submitReport')}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Trip Selection Header */}
            <div className="my-4">
              <div className="text-center mb-3">
                <span className="text-muted small fw-medium">{t('common.or')}</span>
              </div>
              <h4 className="mb-0 d-flex align-items-center justify-content-center">
                <IconCalendar className="me-2 text-primary" size={20} />
                {t('catch.chooseSpecificTrip')}
              </h4>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <div className="text-center">
                  <div className="spinner-border text-primary mb-2" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                  </div>
                  <p className="text-muted">{t('catch.loadingRecentTrips')}</p>
                </div>
              </div>
            ) : error ? (
              <div className="empty">
                <div className="empty-icon">
                  <IconFish size={48} className="text-muted" />
                </div>
                <p className="empty-title">{t('common.error')}</p>
                <p className="empty-subtitle text-muted">{error}</p>
              </div>
            ) : recentTrips.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">
                  <IconFish size={48} className="text-muted" />
                </div>
                <p className="empty-title">{t('catch.noRecentTrips')}</p>
                <p className="empty-subtitle text-muted">
                  {t('catch.noRecentTripsMessage')}
                </p>
              </div>
            ) : (
              <div className="trip-selection-list">
                {Object.entries(tripsByDay).map(([dayLabel, dayTrips]) => (
                  <div key={dayLabel} className="mb-4">
                    {/* Day header */}
                    <div className="d-flex align-items-center mb-2">
                      <IconCalendar size={16} className="me-2 text-muted" />
                      <h5 className="mb-0 text-muted">{dayLabel}</h5>
                    </div>

                    {/* Trips for this day */}
                    <div className="list-group">
                      {dayTrips.map(trip => (
                        <button
                          key={trip.id}
                          className="list-group-item list-group-item-action p-3"
                          onClick={() => onSelectTrip(trip)}
                          style={{ minHeight: '80px' }}
                        >
                          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center">
                            <div className="flex-grow-1">
                              <div className="fw-bold mb-1">{trip.boatName}</div>
                              <div className="text-muted small">
                                <div className="d-flex flex-wrap align-items-center gap-2">
                                  <span className="d-flex align-items-center">
                                    <IconClock size={14} className="me-1" />
                                    {formatTripTime(trip.startTime, trip.endTime)}
                                  </span>
                                  <span className="d-flex align-items-center">
                                    <span className="badge bg-light text-dark">
                                      {getDurationLabel(trip.durationSeconds)}
                                    </span>
                                  </span>
                                  <span className="d-flex align-items-center">
                                    <IconMapPin size={14} className="me-1" />
                                    {trip.community || t('common.unknown')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 mt-sm-0">
                              <small className="text-muted d-block text-sm-end">
                                ID: {trip.id.length > 8 ? `${trip.id.slice(0, 8)}...` : trip.id}
                              </small>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripSelectionModal;