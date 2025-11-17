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
    if (!currentUser || !currentUser.imeis || currentUser.imeis.length === 0) {
      setPerformance(null);
      setLoading(false);
      setError(null);
      return;
    }

    const imei = currentUser.imeis[0]; // Use first IMEI for performance
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFisherPerformance({
        imei,
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
