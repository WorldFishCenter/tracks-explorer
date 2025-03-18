import { format } from 'date-fns';

// Get API credentials from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://analytics.pelagicdata.com/api';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '{$token}'; 
const API_SECRET = import.meta.env.VITE_API_SECRET || '{$secret}';

// Define types for API responses based on actual CSV format
export interface TripPoint {
  // Actual fields from the CSV
  time: string;           // "2025-02-02 15:21:53+00"
  boat: string;           // "24422"
  tripId: string;         // "12951544"
  latitude: number;       // -5.99924
  longitude: number;      // 39.18637
  speed: number;          // 0
  range: number;          // 0.0
  heading: number;        // 0.0
  boatName: string;       // "Mashaallah"
  community: string;      // "Fuji"
  tripCreated: string;    // "2025-02-02 17:35:28+00"
  tripUpdated: string;    // "2025-02-05 05:53:07+00"
  
  // For compatibility with existing code
  timestamp: string;      // Alias for time
  imei?: string;          // Added from request parameters
  deviceId?: string;      // Added for compatibility
  lastSeen?: string;      // Using tripUpdated as lastSeen
}

export interface Trip {
  id: string;             // From trip ID in points
  startTime: string;      // Earliest time in points
  endTime: string;        // Latest time in points
  boat: string;           // Boat number
  boatName: string;       // Boat name
  community: string;      // Community
  durationSeconds: number; // Calculated from points
  rangeMeters: number;    // Maximum range from points
  distanceMeters: number; // Total distance from points
  created: string;        // From tripCreated
  updated: string;        // From tripUpdated
  imei?: string;          // Added from request
  lastSeen?: string;      // Using latest point time
}

export interface TripsFilter {
  dateFrom: Date;
  dateTo: Date;
  imeis?: string[];
  includeDeviceInfo?: boolean;
  includeLastSeen?: boolean;
  tags?: string[];
}

export interface PointsFilter extends TripsFilter {
  includeErrant?: boolean;
}

/**
 * Fetch trips data from Pelagic Data API
 * This function first fetches points and then constructs trips from them
 */
export const fetchTrips = async (filter: TripsFilter): Promise<Trip[]> => {
  // First, fetch all the points for the time range
  const points = await fetchTripPoints(filter);
  
  if (points.length === 0) {
    console.log('No points found, returning empty trips array');
    return [];
  }
  
  console.log(`Constructing trips from ${points.length} points`);
  
  // Group points by trip ID
  const tripMap = new Map<string, TripPoint[]>();
  
  points.forEach(point => {
    if (!tripMap.has(point.tripId)) {
      tripMap.set(point.tripId, []);
    }
    tripMap.get(point.tripId)?.push(point);
  });
  
  // Create trip objects from grouped points
  const trips: Trip[] = [];
  
  for (const [tripId, tripPoints] of tripMap.entries()) {
    // Sort points by time
    tripPoints.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    const firstPoint = tripPoints[0];
    const lastPoint = tripPoints[tripPoints.length - 1];
    
    // Calculate duration in seconds
    const startTime = new Date(firstPoint.time);
    const endTime = new Date(lastPoint.time);
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Calculate distance (using the range values from points)
    const distanceMeters = Math.max(...tripPoints.map(p => p.range));
    
    // Get a representative point for the trip
    const samplePoint = tripPoints.find(p => p.range > 0) || firstPoint;
    
    trips.push({
      id: tripId,
      startTime: firstPoint.time,
      endTime: lastPoint.time,
      boat: firstPoint.boat,
      boatName: firstPoint.boatName,
      community: firstPoint.community,
      durationSeconds,
      rangeMeters: distanceMeters,
      distanceMeters: distanceMeters * 1.2, // Estimate, as total path is likely longer than max range
      created: firstPoint.tripCreated,
      updated: lastPoint.tripUpdated,
      imei: filter.imeis?.[0],
      lastSeen: lastPoint.time
    });
  }
  
  console.log(`Created ${trips.length} trips from points`);
  return trips;
};

/**
 * Fetch trip points data from Pelagic Data API
 */
export const fetchTripPoints = async (filter: PointsFilter): Promise<TripPoint[]> => {
  const dateFrom = format(filter.dateFrom, 'yyyy-MM-dd');
  const dateTo = format(filter.dateTo, 'yyyy-MM-dd');
  
  let url = `${API_BASE_URL}/${API_TOKEN}/v1/points/${dateFrom}/${dateTo}`;
  
  // Add query parameters
  const params: string[] = [];
  
  if (filter.imeis && filter.imeis.length > 0) {
    params.push(`imeis=${filter.imeis.join(',')}`);
  }
  
  if (filter.includeDeviceInfo) {
    params.push('deviceInfo=true');
  }
  
  if (filter.includeErrant) {
    params.push('errant=true');
  }
  
  if (filter.includeLastSeen) {
    params.push('withLastSeen=true');
  }
  
  if (filter.tags && filter.tags.length > 0) {
    params.push(`tags=${filter.tags.join(',')}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  console.log(`Fetching trip points from: ${url}`);
  console.log(`Using IMEI filters: ${filter.imeis?.join(',') || 'None (admin view)'}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-SECRET': API_SECRET,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      
      // Generate mockup data if there's an error
      if (filter.imeis && filter.imeis.length > 0) {
        console.log('Generating mock point data for IMEIs:', filter.imeis);
        return generateMockPoints(filter.imeis[0], filter.dateFrom, filter.dateTo);
      }
      
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    // API returns CSV, we need to parse it
    const csvText = await response.text();
    console.log(`Received CSV data of length: ${csvText.length}`);
    
    if (csvText.trim() === '' || csvText.length < 5) {
      console.log('Empty or invalid CSV response, generating mock data');
      if (filter.imeis && filter.imeis.length > 0) {
        return generateMockPoints(filter.imeis[0], filter.dateFrom, filter.dateTo);
      }
      return [];
    }
    
    const points = parsePointsCSV(csvText, filter.imeis?.[0]);
    console.log(`Parsed ${points.length} points from CSV`);
    
    if (points.length === 0 && filter.imeis && filter.imeis.length > 0) {
      console.log('No points in CSV, generating mock data');
      return generateMockPoints(filter.imeis[0], filter.dateFrom, filter.dateTo);
    }
    
    return points;
  } catch (error) {
    console.error('Error fetching trip points:', error);
    
    // Generate mockup data if there's an error
    if (filter.imeis && filter.imeis.length > 0) {
      console.log('Error occurred, generating mock data');
      return generateMockPoints(filter.imeis[0], filter.dateFrom, filter.dateTo);
    }
    
    throw error;
  }
};

/**
 * Parse CSV response for trip points data
 * Based on the actual CSV format: 
 * Time,Boat,Trip,Lat,Lng,Speed (M/S),Range (Meters),Heading,Boat Name,Community,Trip Created,Trip Updated
 */
const parsePointsCSV = (csv: string, imei?: string): TripPoint[] => {
  if (!csv || csv.trim() === '') {
    console.warn('Empty CSV data received from API');
    return [];
  }
  
  try {
    const lines = csv.trim().split('\n');
    
    if (lines.length < 2) {
      console.warn('CSV data contains only headers or is empty');
      return [];
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('Points CSV headers:', headers);
    
    // Define mapping for CSV fields to our object properties
    const headerIndexes: {[key: string]: number} = {};
    
    // Map the headers to their positions
    headers.forEach((header, index) => {
      // Handle specific headers we know about
      switch (header) {
        case 'Time': headerIndexes['time'] = index; break;
        case 'Boat': headerIndexes['boat'] = index; break;
        case 'Trip': headerIndexes['tripId'] = index; break;
        case 'Lat': headerIndexes['latitude'] = index; break;
        case 'Lng': headerIndexes['longitude'] = index; break;
        case 'Speed (M/S)': headerIndexes['speed'] = index; break;
        case 'Range (Meters)': headerIndexes['range'] = index; break;
        case 'Heading': headerIndexes['heading'] = index; break;
        case 'Boat Name': headerIndexes['boatName'] = index; break;
        case 'Community': headerIndexes['community'] = index; break;
        case 'Trip Created': headerIndexes['tripCreated'] = index; break;
        case 'Trip Updated': headerIndexes['tripUpdated'] = index; break;
        // Add any other known headers here
        default:
          // For unrecognized headers, use a lowercase version of the header name
          headerIndexes[header.toLowerCase().replace(/ /g, '')] = index;
      }
    });
    
    const points: TripPoint[] = [];
    
    // Skip the header row and process all data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      try {
        // Split the CSV line while handling quoted fields
        const values = line.split(',');
        
        // Create a point object using the mapped indices
        const point: any = {
          timestamp: '', // Will be set from time field below
          imei: imei || '' // Add IMEI from filter
        };
        
        // Process each field based on the header mapping
        Object.keys(headerIndexes).forEach(key => {
          const index = headerIndexes[key];
          const value = values[index]?.trim() || '';
          
          if (['latitude', 'longitude', 'speed', 'heading', 'range'].includes(key)) {
            // Convert numeric fields
            point[key] = parseFloat(value) || 0;
          } else {
            // String fields
            point[key] = value;
          }
        });
        
        // Convert speed from m/s to km/h if needed
        if (point.speed !== undefined) {
          // If it seems like the speed is in m/s (common values < 20),
          // convert to km/h for consistency with our app
          if (point.speed < 20) {
            point.speed = point.speed * 3.6; // m/s to km/h
          }
        }
        
        // Add standard timestamp field for compatibility
        if (point.time) {
          point.timestamp = point.time;
        }
        
        // Add deviceId for compatibility
        point.deviceId = point.boat || `device-${imei?.slice(-4)}`;
        
        // Add lastSeen for compatibility
        point.lastSeen = point.tripUpdated || point.time;
        
        points.push(point as TripPoint);
      } catch (lineError) {
        console.error(`Error parsing CSV line ${i}:`, lineError, line);
      }
    }
    
    console.log(`Successfully parsed ${points.length} points`);
    return points;
  } catch (error) {
    console.error('Error parsing points CSV:', error);
    return [];
  }
};

/**
 * Generate realistic mock points for development or when API fails
 */
const generateMockPoints = (imei: string, dateFrom: Date, dateTo: Date): TripPoint[] => {
  const points: TripPoint[] = [];
  const tripCount = 3; // Number of trips to generate
  
  // Generate points for multiple trips
  for (let tripIndex = 0; tripIndex < tripCount; tripIndex++) {
    const tripId = `${100000000 + parseInt(imei.slice(-6)) + tripIndex}`; // Format similar to real trip IDs
    const boatId = `${10000 + parseInt(imei.slice(-4))}`;
    const boatName = `Vessel ${imei.slice(-4)}`;
    const community = ["Fishing Village", "Harbor Bay", "Port Town"][tripIndex % 3];
    
    // Calculate trip start and end dates
    const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    const startDayOffset = Math.floor(tripIndex * (daysDiff / tripCount));
    const tripDuration = Math.min(2, Math.floor(daysDiff / tripCount) - 1) || 1; // 1-2 days per trip
    
    const tripStart = new Date(dateFrom);
    tripStart.setDate(tripStart.getDate() + startDayOffset);
    tripStart.setHours(Math.floor(Math.random() * 12) + 6); // Start between 6 AM and 6 PM
    
    const tripEnd = new Date(tripStart);
    tripEnd.setDate(tripEnd.getDate() + tripDuration);
    
    const tripCreated = new Date(tripStart);
    tripCreated.setHours(tripCreated.getHours() + 2); // Created 2 hours after start
    
    const tripUpdated = new Date(tripEnd);
    tripUpdated.setHours(tripUpdated.getHours() + 3); // Updated 3 hours after end
    
    // Format the dates in the same format as the API
    const tripCreatedStr = tripCreated.toISOString().replace('T', ' ').replace('Z', '+00');
    const tripUpdatedStr = tripUpdated.toISOString().replace('T', ' ').replace('Z', '+00');
    
    // Starting position - adjust as needed for realistic fishing locations
    // Using coordinates around Zanzibar, Tanzania (close to the actual data example)
    const startLat = -6.0 + (Math.random() * 0.5 - 0.25); // Around -6.0 latitude
    const startLng = 39.2 + (Math.random() * 0.5 - 0.25); // Around 39.2 longitude
    
    let currentLat = startLat;
    let currentLng = startLng;
    let currentRange = 0; // Keep track of range from start
    
    // Generate a point every 15 minutes for the duration of the trip
    const totalMinutes = tripDuration * 24 * 60; // Total minutes in the trip
    const intervalMinutes = 15; // One point every 15 minutes
    const pointsToGenerate = Math.floor(totalMinutes / intervalMinutes);
    
    for (let i = 0; i < pointsToGenerate; i++) {
      const pointTime = new Date(tripStart);
      pointTime.setMinutes(pointTime.getMinutes() + i * intervalMinutes);
      
      if (pointTime > dateTo) break;
      
      // Format the time in the same format as the API
      const timeStr = pointTime.toISOString().replace('T', ' ').replace('Z', '+00');
      
      // Movement pattern: create a somewhat realistic fishing vessel track
      // Ships typically move in somewhat continuous paths with occasional turns
      const isMovingFast = Math.random() > 0.7; // 30% chance of moving fast (transit)
      const isFishing = !isMovingFast && Math.random() > 0.3; // When not moving fast, 70% chance of fishing
      
      // Update position
      const movementScale = isMovingFast ? 0.01 : 0.002; // Move faster when in transit
      const turnFactor = Math.random() * 0.2 - 0.1; // Random slight turns
      
      // Calculate new position with some randomness for realism
      currentLat += (Math.random() * movementScale - movementScale/2) + turnFactor;
      currentLng += (Math.random() * movementScale - movementScale/2) + turnFactor;
      
      // Calculate speed based on movement pattern
      const speedMs = isMovingFast ? 4 + Math.random() * 3 : // 4-7 m/s in transit
                     isFishing ? 0.5 + Math.random() * 1 : // 0.5-1.5 m/s when fishing
                     0 + Math.random() * 0.5; // 0-0.5 m/s when drifting
                    
      const heading = Math.floor(Math.random() * 360); // 0-359 degrees
      
      // Calculate distance from start (range)
      const latDiff = currentLat - startLat;
      const lngDiff = currentLng - startLng;
      // Simple approximation of distance in meters
      const rangeDeltaMeters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111319;
      currentRange = Math.max(currentRange, rangeDeltaMeters);
      
      points.push({
        time: timeStr,
        timestamp: timeStr, // For compatibility with existing code
        boat: boatId,
        tripId: tripId,
        latitude: currentLat,
        longitude: currentLng,
        speed: speedMs, // In m/s as per API
        range: currentRange,
        heading: heading,
        boatName: boatName,
        community: community,
        tripCreated: tripCreatedStr,
        tripUpdated: tripUpdatedStr,
        imei: imei,
        deviceId: boatId,
        lastSeen: timeStr
      });
    }
  }
  
  return points;
};

// Helper function to get a date range for the last N days
export const getDateRangeForLastDays = (days: number): {dateFrom: Date, dateTo: Date} => {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  return { dateFrom, dateTo };
}; 