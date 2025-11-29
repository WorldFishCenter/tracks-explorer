import { useState, useEffect, useCallback } from 'react';
import { FisherPerformanceResponse } from '../types';
import { fetchFisherPerformance } from '../api/fisherStatsService';
import { useAuth } from '../contexts/AuthContext';

interface UseFisherPerformanceReturn {
  performance: FisherPerformanceResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFisherPerformance = (
  dateFrom?: Date,
  dateTo?: Date,
  compareWith: 'community' | 'previous' = 'community'
): UseFisherPerformanceReturn => {
  const { currentUser } = useAuth();
  const [performance, setPerformance] = useState<FisherPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setPerformance(null);
      setLoading(false);
      setError(null);
      return;
    }

    // For PDS users, use IMEI. For non-PDS users, use username
    // The R backend pipeline stores username in the imei column for non-PDS users
    const identifier = currentUser.imeis && currentUser.imeis.length > 0
      ? currentUser.imeis[0]  // PDS user - use IMEI
      : currentUser.username; // Non-PDS user - use username

    if (!identifier) {
      setPerformance(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFisherPerformance({
        imei: identifier, // Can be IMEI or username
        dateFrom,
        dateTo,
        compareWith
      });

      setPerformance(result);
    } catch (err) {
      console.error('Error fetching fisher performance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance metrics';
      setError(errorMessage);
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFrom, dateTo, compareWith]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    performance,
    loading,
    error,
    refetch: fetchData
  };
};
