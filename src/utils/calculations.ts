import { subDays } from 'date-fns';
import { TripPoint, Trip, VesselInsights, VesselDetails, LiveLocation } from '../types';

/**
 * Calculate vessel insights from trip points
 */
export const calculateVesselInsights = (tripPoints: TripPoint[]): VesselInsights => {
  if (!tripPoints || tripPoints.length === 0) {
    return { activeTrips: 0, totalDistance: 0, avgSpeed: 0 };
  }

  // Group points by trip ID
  const tripGroups: Record<string, TripPoint[]> = {};
  
  tripPoints.forEach(point => {
    if (!tripGroups[point.tripId]) {
      tripGroups[point.tripId] = [];
    }
    tripGroups[point.tripId].push(point);
  });

  // Count active trips (had points in the last 24 hours)
  const oneDayAgo = subDays(new Date(), 1).getTime();
  const activeTrips = Object.values(tripGroups).filter(points => {
    const latestPoint = points.sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    )[0];
    return latestPoint && new Date(latestPoint.time).getTime() > oneDayAgo;
  }).length;

  // Calculate total distance (in km)
  const totalDistance = Object.values(tripGroups).reduce((sum, points) => {
    // Use the max range value as an approximation of trip distance
    const maxRange = Math.max(...points.map(p => p.range || 0));
    return sum + (maxRange / 1000); // Convert from meters to km
  }, 0);

  // Calculate average speed across all points
  const allSpeeds = tripPoints.map(p => p.speed || 0);
  const avgSpeed = allSpeeds.length > 0 
    ? allSpeeds.reduce((sum, speed) => sum + speed, 0) / allSpeeds.length 
    : 0;

  return {
    activeTrips,
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    avgSpeed: parseFloat(avgSpeed.toFixed(1))
  };
};

/**
 * Calculate average speed for a specific trip
 */
export const calculateTripAverageSpeed = (tripPoints: TripPoint[]): number => {
  const validSpeedPoints = tripPoints.filter(point => point.speed != null && point.speed > 0);
  return validSpeedPoints.length > 0
    ? validSpeedPoints.reduce((sum, point) => sum + (point.speed || 0), 0) / validSpeedPoints.length
    : 0;
};

/**
 * Get vessel status based on last seen time
 */
export const getVesselStatus = (lastSeen: string): 'active' | 'docked' | 'unknown' => {
  if (!lastSeen) return 'unknown';
  
  const lastSeenDate = new Date(lastSeen);
  const oneDayAgo = subDays(new Date(), 1);
  
  return lastSeenDate > oneDayAgo ? 'active' : 'docked';
};

/**
 * Convert vessel details from live location data
 */
export const convertLiveLocationToVesselDetails = (location: LiveLocation): VesselDetails => {
  return {
    id: location.imei || location.externalBoatId || 'unknown',
    name: location.externalBoatId || location.imei || 'Unknown Vessel',
    lastUpdate: location.lastSeen ? new Date(location.lastSeen).toLocaleString() : 'Unknown',
    status: getVesselStatus(location.lastSeen ? location.lastSeen.toISOString() : ''),
    speed: 0, // Speed not available in live location data
    imei: location.imei,
    batteryState: location.batteryState,
    community: location.directCustomerName,
    coordinates: { lat: location.lat, lng: location.lng },
    lastGpsTime: location.lastGpsTs ? new Date(location.lastGpsTs).toLocaleString() : undefined,
    lastSeenTime: location.lastSeen ? new Date(location.lastSeen).toLocaleString() : undefined,
    externalBoatId: location.externalBoatId
  };
};

/**
 * Convert trip to vessel details
 */
export const convertTripToVesselDetails = (
  trip: Trip, 
  tripPoints: TripPoint[], 
  liveLocation?: LiveLocation
): VesselDetails => {
  const tripPointsForTrip = tripPoints.filter(point => point.tripId === trip.id);
  const avgSpeed = calculateTripAverageSpeed(tripPointsForTrip);
  
  // Get the latest point for coordinates
  const latestPoint = tripPointsForTrip.length > 0 
    ? tripPointsForTrip.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0]
    : null;

  return {
    id: trip.id,
    name: trip.boatName || `Trip ${trip.id}`,
    lastUpdate: trip.lastSeen || trip.endTime,
    status: getVesselStatus(trip.lastSeen || trip.endTime),
    speed: avgSpeed,
    distanceKm: trip.distanceMeters ? trip.distanceMeters / 1000 : undefined,
    durationMinutes: trip.durationSeconds ? Math.round(trip.durationSeconds / 60) : undefined,
    imei: trip.imei,
    batteryState: liveLocation?.batteryState,
    community: trip.community || liveLocation?.directCustomerName,
    coordinates: liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : 
                latestPoint ? { lat: latestPoint.latitude, lng: latestPoint.longitude } : undefined,
    lastGpsTime: liveLocation?.lastGpsTs ? new Date(liveLocation.lastGpsTs).toLocaleString() : undefined,
    lastSeenTime: liveLocation?.lastSeen ? new Date(liveLocation.lastSeen).toLocaleString() : undefined,
    externalBoatId: liveLocation?.externalBoatId
  };
}; 