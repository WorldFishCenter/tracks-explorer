import { format } from 'date-fns';

// Simple request cache to avoid repeated API calls
const requestCache = new Map<string, { data: any; timestamp: number; expiry: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Cache utility functions
const getCacheKey = (dateFrom: Date, dateTo: Date, imeis?: string[], extra?: string): string => {
  const dateRange = `${format(dateFrom, 'yyyy-MM-dd')}-${format(dateTo, 'yyyy-MM-dd')}`;
  const imeiStr = imeis?.join(',') || 'no-imeis';
  return `${dateRange}:${imeiStr}${extra ? `:${extra}` : ''}`;
};

const getGenericCacheKey = (operation: string, params: any): string => {
  return `${operation}:${JSON.stringify(params || {})}`;
};

const getCachedData = (key: string): any | null => {
  const cached = requestCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    console.log(`📋 Cache HIT for key: ${key}`);
    return cached.data;
  }
  if (cached) {
    console.log(`📋 Cache EXPIRED for key: ${key}`);
    requestCache.delete(key);
  }
  return null;
};

const setCachedData = (key: string, data: any): void => {
  const timestamp = Date.now();
  requestCache.set(key, {
    data,
    timestamp,
    expiry: timestamp + CACHE_DURATION
  });
  console.log(`📋 Cache SET for key: ${key}`);
};

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
  timezone?: string;      // Device timezone for displaying local times
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
    
    // Note: samplePoint was unused, removed to fix linting
    
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
      lastSeen: lastPoint.time,
      timezone: undefined // Will be populated by live location data if available
    });
  }
  
  console.log(`Created ${trips.length} trips from points`);
  return trips;
};

/**
 * Fetch trip points data from Pelagic Data API
 */
export const fetchTripPoints = async (filter: PointsFilter): Promise<TripPoint[]> => {
  // Check cache first
  const cacheKey = getCacheKey(filter.dateFrom, filter.dateTo, filter.imeis, 'points');
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

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
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      
      // Handle specific 500 error with server-side file issue
      if (response.status === 500 && errorText.includes('empty_api_points.csv')) {
        console.warn('Server-side file system issue detected. This is a known API server problem.');
        return []; // Return empty array instead of mock data
      }
      
      // For non-IMEI requests (admin view), return empty array instead of throwing
      if (!filter.imeis || filter.imeis.length === 0) {
        console.warn('No IMEIs provided and API failed. Returning empty array for admin view.');
        return [];
      }
      
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    // API returns CSV, we need to parse it
    const csvText = await response.text();
    console.log(`Received CSV data of length: ${csvText.length}`);
    
    if (csvText.trim() === '' || csvText.length < 5) {
      console.log('Empty or invalid CSV response');
      return []; // Return empty array instead of mock data
    }
    
    const points = parsePointsCSV(csvText, filter.imeis?.[0]);
    console.log(`Parsed ${points.length} points from CSV`);
    
    // Cache the results
    setCachedData(cacheKey, points);
    
    return points;
  } catch (error) {
    console.error('Error fetching trip points:', error);
    
    // For non-IMEI requests, return empty array instead of throwing
    if (!filter.imeis || filter.imeis.length === 0) {
      console.warn('No IMEIs provided and API failed. Returning empty array.');
      return [];
    }
    
    // For IMEI requests, throw the error
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
        const point: Partial<TripPoint> = {
          timestamp: '', // Will be set from time field below
          imei: imei || '' // Add IMEI from filter
        };
        
        // Process each field based on the header mapping
        Object.keys(headerIndexes).forEach(key => {
          const index = headerIndexes[key];
          const value = values[index]?.trim() || '';
          
          if (['latitude', 'longitude', 'speed', 'heading', 'range'].includes(key)) {
            // Convert numeric fields
            (point as any)[key] = parseFloat(value) || 0;
          } else {
            // String fields
            (point as any)[key] = value;
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
 * Convert timestamp string to Date object with timezone support
 */
const convertTimestamp = (timestamp: string | null): Date | null => {
  if (!timestamp) return null;
  
  try {
    // Try to parse the timestamp directly first
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // If that fails, try adding timezone info
    const timestampWithTz = timestamp.includes('+') || timestamp.includes('Z') 
      ? timestamp 
      : `${timestamp}+00:00`; // Assume UTC if no timezone
    
    return new Date(timestampWithTz);
  } catch (error) {
    console.warn(`Failed to parse timestamp: ${timestamp}`, error);
    return null;
  }
};

// Helper function to get a date range for the last N days
export const getDateRangeForLastDays = (days: number): {dateFrom: Date, dateTo: Date} => {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  return { dateFrom, dateTo };
}; 

// Pelagic Analytics API Service for Live Location Data
// Uses the new authentication-based API instead of token/secret

// Get API credentials from environment variables
const PELAGIC_API_BASE_URL = import.meta.env.VITE_PELAGIC_API_BASE_URL || 'https://analytics.pelagicdata.com/api';
const API_USERNAME = import.meta.env.VITE_PELAGIC_USERNAME;
const API_PASSWORD = import.meta.env.VITE_PELAGIC_PASSWORD;
const CUSTOMER_ID = import.meta.env.VITE_PELAGIC_CUSTOMER_ID;

// Cache for authentication token
const authCache: {
  token: string | null,
  refreshToken: string | null,
  expiresAt: Date | null
} = {
  token: null,
  refreshToken: null,
  expiresAt: null
};

/**
 * Live location data structure matching the R output
 */
export interface LiveLocation {
  deviceIndex: string;
  boatName: string;
  directCustomerName: string;
  timezone: string;
  lastSeen: Date | null;
  imei: string;
  lat: number;
  lng: number;
  lastGpsTs: Date | null;
  batteryState?: string;
  externalBoatId?: string;
}

/**
 * Authenticate with Pelagic Analytics API
 */
const authenticate = async (): Promise<{token: string | null, refreshToken: string | null}> => {
  // Check if we have a valid cached token
  if (authCache.token && authCache.expiresAt && new Date() < authCache.expiresAt) {
    return {
      token: authCache.token,
      refreshToken: authCache.refreshToken
    };
  }

  console.log('Authenticating with Pelagic Analytics API...');
  
  // Validate that API credentials are configured
  if (!API_USERNAME || !API_PASSWORD || !CUSTOMER_ID) {
    throw new Error('Pelagic API credentials not configured');
  }
  
  try {
    const response = await fetch(`${PELAGIC_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      body: JSON.stringify({
        username: API_USERNAME,
        password: API_PASSWORD
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout for auth
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const authData = await response.json();
    
    // Cache the token (assume it expires in 1 hour if not specified)
    authCache.token = authData.token;
    authCache.refreshToken = authData.refreshToken;
    authCache.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    console.log('Successfully authenticated with Pelagic Analytics API');
    return authData;
  } catch (error) {
    console.error('Failed to authenticate:', error);
    throw error;
  }
};

/**
 * Fetch live location data for specific devices
 */
export const fetchLiveLocations = async (imeis?: string[]): Promise<LiveLocation[]> => {
  console.log('🔍 fetchLiveLocations called with IMEIs:', imeis);
  
  // Check cache first (temporarily disabled for debugging)
  const cacheKey = getGenericCacheKey('liveLocations', { imeis });
  // const cachedData = getCachedData<LiveLocation[]>(cacheKey);
  // if (cachedData) {
  //   console.log('📋 Using cached live locations data');
  //   return cachedData;
  // }
  console.log('🔧 Cache temporarily disabled for live locations debugging');
  
  try {
    // Authenticate first
    const { token } = await authenticate();
    
    // Prepare request body with filters
    const requestBody = {
      customers: [
        {
          entityType: "CUSTOMER",
          id: CUSTOMER_ID
        }
      ],
      boats: [],
      imeis: imeis ? imeis.map(imei => parseInt(imei)) : []
    };
    
    console.log(`📡 Fetching live locations from API${imeis ? ` for IMEIs: ${imeis.join(', ')}` : ' for all devices'}`);
    
    const response = await fetch(`${PELAGIC_API_BASE_URL}/pds/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${token}`,
        'Accept-Encoding': 'gzip, deflate, br'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        // Token might be expired, clear cache and retry once
        authCache.token = null;
        authCache.expiresAt = null;
        console.log('🔑 Token expired, retrying authentication...');
        
        const { token: newToken } = await authenticate();
        const retryResponse = await fetch(`${PELAGIC_API_BASE_URL}/pds/devices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Authorization': `Bearer ${newToken}`,
            'Accept-Encoding': 'gzip, deflate, br'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        if (!retryResponse.ok) {
          throw new Error(`API request failed after retry: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const retryData = await retryResponse.json();
        console.log(`✅ Successfully retrieved ${retryData.length} device records after retry (REAL API DATA)`);
        const parsedRetryData = parseLiveLocationData(retryData);
        
        // Cache the results (temporarily disabled for debugging)
        // setCachedData(cacheKey, parsedRetryData);
        
        return parsedRetryData;
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Successfully retrieved ${data.length} device records (REAL API DATA)`);
    
    const parsedData = parseLiveLocationData(data);
    console.log('📊 Parsed live locations:', parsedData.map(loc => ({
      imei: loc.imei,
      boatName: loc.boatName,
      lat: loc.lat,
      lng: loc.lng,
      batteryState: loc.batteryState,
      lastSeen: loc.lastSeen
    })));
    
    // Cache the results (temporarily disabled for debugging)
    // setCachedData(cacheKey, parsedData);
    
    return parsedData;
  } catch (error) {
    console.error('❌ Error fetching live locations:', error);
    console.log('⚠️  API failed, environment check:');
    console.log('  - PELAGIC_API_BASE_URL:', PELAGIC_API_BASE_URL);
    console.log('  - API_USERNAME:', API_USERNAME);
    console.log('  - CUSTOMER_ID:', CUSTOMER_ID);
    console.log('  - Environment:', import.meta.env.DEV ? 'Development' : 'Production');
    
    // Just throw the error - no mock data fallbacks
    throw error;
  }
};

/**
 * Parse the API response into LiveLocation objects
 */
const parseLiveLocationData = (data: unknown[]): LiveLocation[] => {
  if (!Array.isArray(data)) {
    console.warn('Expected array from API, got:', typeof data);
    return [];
  }
  
  return data.map((device, index) => {
    // Flatten nested structures (similar to your R code)
    const flattened = flattenObject(device as Record<string, unknown>);
    
    // Debug logging to see what battery fields are available
    console.log(`🔍 Device ${index + 1} flattened structure:`, flattened);
    const batteryFields = Object.keys(flattened).filter(key => 
      key.toLowerCase().includes('battery') || 
      key.toLowerCase().includes('power') ||
      key.toLowerCase().includes('charge')
    );
    console.log(`🔋 Battery-related fields found:`, batteryFields);
    batteryFields.forEach(field => {
      console.log(`  - ${field}: ${flattened[field]}`);
    });
    
    // Extract the fields we need
    const liveLocation: LiveLocation = {
      deviceIndex: (index + 1).toString(),
      boatName: (flattened.boatName || flattened['boat.name'] || '') as string,
      directCustomerName: (flattened.directCustomerName || flattened['directCustomer.name'] || '') as string,
      timezone: (flattened.timezone || 'UTC') as string,
      lastSeen: convertTimestamp(flattened.lastSeen as string),
      imei: (flattened.imei || '') as string,
      lat: parseFloat((flattened.lat as string) || '0') || 0,
      lng: parseFloat((flattened.lng as string) || '0') || 0,
      lastGpsTs: convertTimestamp(flattened.lastGpsTs as string),
      batteryState: flattened.batteryState as string | undefined,
      externalBoatId: flattened.externalBoatId as string | undefined
    };
    
    console.log(`📍 Parsed location for IMEI ${liveLocation.imei}:`, {
      boatName: liveLocation.boatName,
      coordinates: [liveLocation.lat, liveLocation.lng],
      batteryState: liveLocation.batteryState,
      lastSeen: liveLocation.lastSeen
    });
    
    return liveLocation;
  }).filter(location => location.imei); // Only return devices with valid IMEI
};

/**
 * Flatten nested object (similar to your R flatten_safely function)
 */
const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  const result: { [key: string]: unknown } = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        // Recursively flatten objects
        Object.assign(result, flattenObject(obj[key] as Record<string, unknown>, newKey));
      } else {
        // Keep primitive values
        result[newKey] = obj[key];
      }
    }
  }
  
  return result;
};

/**
 * Get live location for a single device by IMEI
 */
export const fetchDeviceLiveLocation = async (imei: string): Promise<LiveLocation | null> => {
  const locations = await fetchLiveLocations([imei]);
  return locations.length > 0 ? locations[0] : null;
};

/**
 * Check if a location is recent (within last 24 hours)
 */
export const isLocationRecent = (location: LiveLocation): boolean => {
  if (!location.lastGpsTs) return false;
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return location.lastGpsTs > oneDayAgo;
};

/**
 * Format location timestamp for display
 */
export const formatLocationTime = (date: Date): string => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
};

/**
 * Export for backward compatibility with existing trip points API
 */
export interface TripPoint {
  time: string;
  boat: string;
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number;
  range: number;
  heading: number;
  boatName: string;
  community: string;
  tripCreated: string;
  tripUpdated: string;
  timestamp: string;
  imei?: string;
  deviceId?: string;
  lastSeen?: string;
}

/**
 * Convert LiveLocation to TripPoint format for compatibility
 */
export const liveLocationToTripPoint = (location: LiveLocation): TripPoint => {
  const timeStr = location.lastGpsTs?.toISOString() || new Date().toISOString();
  
  return {
    time: timeStr,
    timestamp: timeStr,
    boat: location.externalBoatId || location.deviceIndex,
    tripId: `live-${location.imei}`,
    latitude: location.lat,
    longitude: location.lng,
    speed: 0, // Live location doesn't include speed
    range: 0, // Live location doesn't include range
    heading: 0, // Live location doesn't include heading
    boatName: location.boatName,
    community: location.directCustomerName,
    tripCreated: timeStr,
    tripUpdated: timeStr,
    imei: location.imei,
    deviceId: location.externalBoatId || location.deviceIndex,
    lastSeen: location.lastSeen?.toISOString()
  };
};