import { useState, useEffect } from 'react';
import { Trip, TripPoint, TripPointsParams, TripsParams } from '../types';
import { fetchTrips, fetchTripPoints } from '../api/pelagicDataService';
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

  const fetchData = async () => {
    if (!currentUser) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const imeis = currentUser.imeis;

      console.log('Fetching trip data with IMEIs:', imeis);
      console.log('Date range:', dateFrom, dateTo);

      // Fetch both trip points and trips at the same time
      const [points, tripData] = await Promise.all([
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
        })
      ]);

      setTripPoints(points);
      setTrips(tripData);
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
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, dateFrom, dateTo]);

  return {
    trips,
    tripPoints,
    loading,
    dataAvailable,
    errorMessage,
    refetch: fetchData
  };
}; 