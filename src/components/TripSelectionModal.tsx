import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fish, Calendar, Clock, MapPin } from 'lucide-react';
import { Trip } from '../types';
import { getTripDayLabel } from '../utils/formatters';
import { format, subDays } from 'date-fns';
import { fetchTrips } from '../api/pelagicDataService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  // Handle direct catch report (without trip selection)
  const handleDirectCatchReport = () => {
    // Create a placeholder trip object for direct catch reporting
    const placeholderTrip: Trip = {
      id: `standalone_${Date.now()}`,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      boat: currentUser?.imeis?.[0] || '',
      boatName: t('catch.directCatchReport') || 'Direct Catch',
      community: currentUser?.name || t('common.unknown'),
      durationSeconds: 0,
      rangeMeters: 0,
      distanceMeters: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      imei: currentUser?.imeis?.[0] || ''
    };
    
    onSelectTrip(placeholderTrip);
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Fish className="mr-2" size={24} />
            {t('catch.reportCatch')}
          </DialogTitle>
          <DialogDescription>
            {t('catch.chooseSpecificTrip')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">{t('catch.loadingRecentTrips')}</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4 py-8">
              <Fish size={48} className="mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{t('common.error')}</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : recentTrips.length === 0 ? (
            <div className="text-center space-y-4 py-8">
              <Fish size={48} className="mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{t('catch.noRecentTrips')}</h3>
                <p className="text-muted-foreground">
                  {t('catch.noRecentTripsMessage')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(tripsByDay).map(([dayLabel, dayTrips]) => (
                <div key={dayLabel} className="space-y-3">
                  {/* Day header */}
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <h5 className="font-semibold text-muted-foreground">{dayLabel}</h5>
                  </div>

                  {/* Trips for this day */}
                  <div className="space-y-2">
                    {dayTrips.map(trip => (
                      <Button
                        key={trip.id}
                        variant="ghost"
                        className="h-auto p-4 justify-start text-left hover:bg-accent"
                        onClick={() => onSelectTrip(trip)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{trip.boatName}</div>
                            <span className="text-sm text-muted-foreground">
                              {t('catch.tripId')}: {trip.id.length > 8 ? `${trip.id.slice(0, 8)}...` : trip.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              {formatTripTime(trip.startTime, trip.endTime)}
                            </span>
                            <Badge variant="secondary">
                              {getDurationLabel(trip.durationSeconds)}
                            </Badge>
                            <span className="flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {trip.community || t('common.unknown')}
                            </span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Direct Catch Report Section */}
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-primary mb-1">{t('catch.tripNotInList')}</h3>
                  <p className="text-muted-foreground text-sm">{t('catch.reportWithoutTrip')}</p>
                </div>
                <Button
                  onClick={handleDirectCatchReport}
                  className="min-h-[42px] gap-2"
                >
                  <Fish size={20} />
                  <span className="font-semibold">{t('catch.reportCatchButton')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripSelectionModal;