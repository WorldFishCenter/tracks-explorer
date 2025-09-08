import { useState, useEffect, useCallback } from 'react';
import { Trip, TripPoint } from '../types';
import { fetchTrips, fetchTripPoints, fetchLiveLocations } from '../api/pelagicDataService';
import { useAuth } from '../contexts/AuthContext';

interface UseTripDataReturn {
  trips: Trip[];
  tripPoints: TripPoint[];
  loading: boolean;
  dataAvailable: boolean | null;
  errorMessage: string | null;
  refetch: () => Promise<void>;
}

export const useTripData = (
  dateFrom: Date,
  dateTo: Date
): UseTripDataReturn => {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataAvailable, setDataAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const imeis = currentUser.imeis;

      console.log('Fetching trip data with IMEIs:', imeis);
      console.log('Date range:', dateFrom, dateTo);

      // Fetch trip points, trips, and live locations at the same time
      const [points, tripData, liveLocations] = await Promise.all([
        fetchTripPoints({
          dateFrom,
          dateTo,
          imeis,
          includeDeviceInfo: true,
          includeLastSeen: true
        }),
        fetchTrips({
          dateFrom,
          dateTo,
          imeis,
          includeDeviceInfo: true,
          includeLastSeen: true
        }),
        fetchLiveLocations(imeis).catch(err => {
          console.warn('Failed to fetch live locations for timezone info:', err);
          return []; // Return empty array if live locations fail
        })
      ]);

      // Create a map of IMEI -> timezone from live locations
      const timezoneMap = new Map<string, string>();
      liveLocations.forEach(location => {
        if (location.imei && location.timezone) {
          timezoneMap.set(location.imei, location.timezone);
        }
      });

      // Add timezone information to trips based on IMEI
      const tripsWithTimezone = tripData.map(trip => ({
        ...trip,
        timezone: trip.imei ? timezoneMap.get(trip.imei) : undefined
      }));

      setTripPoints(points);
      setTrips(tripsWithTimezone);
      setDataAvailable(points.length > 0 || tripData.length > 0);

      console.log(`Loaded ${points.length} trip points and ${tripData.length} trips`);

      if (points.length > 0) {
        console.log("Sample point:", points[0]);
      }

      if (tripData.length > 0) {
        console.log("Sample trip:", tripData[0]);
      }
    } catch (err) {
      console.error('Error fetching trip data:', err);
      setDataAvailable(false);
      setErrorMessage('Failed to retrieve vessel data. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [currentUser, dateFrom, dateTo, fetchData]);

  return {
    trips,
    tripPoints,
    loading,
    dataAvailable,
    errorMessage,
    refetch: fetchData
  };
}; 