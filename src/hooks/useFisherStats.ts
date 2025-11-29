import { useState, useEffect, useCallback } from 'react';
import { FisherStatsResponse } from '../types';
import { fetchFisherStats } from '../api/fisherStatsService';
import { useAuth } from '../contexts/AuthContext';

interface UseFisherStatsReturn {
  stats: FisherStatsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFisherStats = (
  dateFrom?: Date,
  dateTo?: Date,
  compareWith: 'community' | 'previous' = 'community'
): UseFisherStatsReturn => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<FisherStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setStats(null);
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
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFisherStats({
        imei: identifier, // Can be IMEI or username
        dateFrom,
        dateTo,
        compareWith
      });

      setStats(result);
    } catch (err) {
      console.error('Error fetching fisher stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load catch statistics';
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFrom, dateTo, compareWith]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    loading,
    error,
    refetch: fetchData
  };
};
