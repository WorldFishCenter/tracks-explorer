import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconFish, IconCalendar, IconClock, IconMapPin, IconLoader } from '@tabler/icons-react';
import { Trip } from '../types';
import { formatTripDate, formatTripDateTime, getTripDayLabel } from '../utils/formatters';
import { format, subDays } from 'date-fns';
import { fetchTrips } from '../api/pelagicDataService';
import { useAuth } from '../contexts/AuthContext';

interface TripSelectionModalProps {
  onSelectTrip: (trip: Trip) => void;
  onClose: () => void;
}

interface TripsByDay {
  [dayLabel: string]: Trip[];
}

const TripSelectionModal: React.FC<TripSelectionModalProps> = ({ onSelectTrip, onClose }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  
  // State for recent trips
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
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
            <div className="alert alert-info mb-3">
              <div className="d-flex">
                <div>
                  <IconFish className="me-2" />
                </div>
                <div>
                  {t('catch.selectFromRecentTrips')}
                </div>
              </div>
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
              <div className="trip-selection-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                          style={{ minHeight: '70px' }}
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