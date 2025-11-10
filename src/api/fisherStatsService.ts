import {
  FisherStatsResponse,
  FisherStatsParams,
  FisherPerformanceResponse,
  FisherPerformanceParams
} from '../types';
import i18n from '../i18n';
import { isDemoMode } from '../utils/demoData';

// API URL - dynamically set based on environment
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment
  ? 'http://localhost:3001/api'
  : '/api';

/**
 * Fetch fisher catch statistics
 * Returns summary, catch by type, recent trips, and comparison data
 */
export async function fetchFisherStats(params: FisherStatsParams): Promise<FisherStatsResponse> {
  // Check if we're in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: returning mock fisher stats');
    return {
      summary: {
        totalCatch: 156.5,
        totalTrips: 8,
        successfulTrips: 6,
        successRate: 0.75,
        avgCatchPerTrip: 19.6
      },
      catchByType: [
        { fishGroup: 'tuna/tuna-like', totalKg: 95.0, count: 4 },
        { fishGroup: 'large pelagics', totalKg: 41.5, count: 2 },
        { fishGroup: 'reef fish', totalKg: 20.0, count: 1 }
      ],
      recentTrips: [
        { tripId: 'demo-trip-1', date: new Date().toISOString(), catch_kg: 45.5, fishGroup: 'tuna/tuna-like' },
        { tripId: 'demo-trip-2', date: new Date(Date.now() - 86400000).toISOString(), catch_kg: 0 },
        { tripId: 'demo-trip-3', date: new Date(Date.now() - 172800000).toISOString(), catch_kg: 32.0, fishGroup: 'large pelagics' }
      ],
      comparison: {
        type: 'community',
        avgCatch: 18.2,
        avgSuccessRate: 0.68,
        basedOn: '15 fishers in your community'
      }
    };
  }

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom.toISOString());
    }
    if (params.dateTo) {
      queryParams.append('dateTo', params.dateTo.toISOString());
    }
    if (params.compareWith) {
      queryParams.append('compareWith', params.compareWith);
    }

    const url = `${API_URL}/fisher-stats/${params.imei}?${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = i18n.t('api.failedToFetchStats', { status: response.status });

      if (response.status === 404) {
        errorMessage = i18n.t('api.noStatsFound');
      } else if (response.status === 500) {
        errorMessage = i18n.t('api.serverError');
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching fisher stats:', error);
    throw error;
  }
}

/**
 * Fetch fisher performance metrics
 * Returns trip types, efficiency metrics, best trips, and comparison data
 */
export async function fetchFisherPerformance(params: FisherPerformanceParams): Promise<FisherPerformanceResponse> {
  // Check if we're in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: returning mock fisher performance');
    return {
      tripTypes: {
        offshore: { count: 3, avgCatch: 35.2 },
        'mid-range': { count: 4, avgCatch: 22.5 },
        nearshore: { count: 1, avgCatch: 15.0 }
      },
      metrics: {
        cpue_kg_per_hour: {
          yourAvg: 4.5,
          comparisonAvg: 3.8,
          percentDiff: 18
        },
        kg_per_liter: {
          yourAvg: 2.3,
          comparisonAvg: 2.1,
          percentDiff: 10
        },
        search_ratio: {
          yourAvg: 0.35,
          comparisonAvg: 0.42,
          percentDiff: -17
        }
      },
      bestTrips: [
        {
          tripId: 'demo-trip-best-1',
          cpue: 6.8,
          date: new Date(Date.now() - 259200000).toISOString(),
          tripType: 'offshore'
        },
        {
          tripId: 'demo-trip-best-2',
          cpue: 5.2,
          date: new Date(Date.now() - 432000000).toISOString(),
          tripType: 'mid-range'
        }
      ],
      comparison: {
        type: 'community',
        basedOn: '15 fishers in your community'
      }
    };
  }

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom.toISOString());
    }
    if (params.dateTo) {
      queryParams.append('dateTo', params.dateTo.toISOString());
    }
    if (params.compareWith) {
      queryParams.append('compareWith', params.compareWith);
    }

    const url = `${API_URL}/fisher-performance/${params.imei}?${queryParams.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = i18n.t('api.failedToFetchPerformance', { status: response.status });

      if (response.status === 404) {
        errorMessage = i18n.t('api.noPerformanceFound');
      } else if (response.status === 500) {
        errorMessage = i18n.t('api.serverError');
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching fisher performance:', error);
    throw error;
  }
}
