import { TripPoint } from '../types';

/**
 * Format trip points for deck.gl layers
 */
export const formatPointsForLayers = (points: TripPoint[]): Record<string, TripPoint[]> => {
  const tripById: Record<string, TripPoint[]> = {};

  // Group points by trip ID
  points.forEach(point => {
    if (!tripById[point.tripId]) {
      tripById[point.tripId] = [];
    }
    tripById[point.tripId].push(point);
  });

  // Sort points in each trip by timestamp
  Object.keys(tripById).forEach(tripId => {
    tripById[tripId].sort((a, b) =>
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  });

  return tripById;
};

/**
 * Calculate center point from trip points
 */
export const calculateCenterFromPoints = (points: TripPoint[]): { latitude: number; longitude: number } => {
  if (points.length === 0) {
    return { latitude: -4.4, longitude: 39.6 }; // Default to East Africa coast
  }

  const totalLat = points.reduce((sum, p) => sum + p.latitude, 0);
  const totalLng = points.reduce((sum, p) => sum + p.longitude, 0);
  
  return {
    latitude: totalLat / points.length,
    longitude: totalLng / points.length
  };
};

/**
 * Calculate bounding box from trip points
 */
export const calculateBoundingBox = (points: TripPoint[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} => {
  if (points.length === 0) {
    return { minLat: -4.4, maxLat: -4.4, minLng: 39.6, maxLng: 39.6 };
  }

  let minLat = Number.MAX_VALUE;
  let maxLat = Number.MIN_VALUE;
  let minLng = Number.MAX_VALUE;
  let maxLng = Number.MIN_VALUE;

  points.forEach(p => {
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLng = Math.min(minLng, p.longitude);
    maxLng = Math.max(maxLng, p.longitude);
  });

  return { minLat, maxLat, minLng, maxLng };
}; 