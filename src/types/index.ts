// Core data types
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
  // Additional fields for compatibility
  batteryState?: string;
  lastGpsTs?: string;
  directCustomerName?: string;
  externalBoatId?: string;
}

export interface Trip {
  id: string;
  startTime: string;
  endTime: string;
  boat: string;
  boatName: string;
  community: string;
  durationSeconds: number;
  rangeMeters: number;
  distanceMeters: number;
  created: string;
  updated: string;
  imei?: string;
  lastSeen?: string;
  // Additional fields for compatibility
  batteryState?: string;
  directCustomerName?: string;
  externalBoatId?: string;
}

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

// UI Component types
export interface VesselDetails {
  id: string;
  name: string;
  captain?: string;
  registration?: string;
  lastUpdate: string;
  status: 'active' | 'docked' | 'unknown';
  fishing?: boolean;
  speed: number;
  distanceKm?: number;
  durationMinutes?: number;
  imei?: string;
  batteryState?: string;
  community?: string;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  lastGpsTime?: string;
  lastSeenTime?: string;
  externalBoatId?: string;
}

export interface MapProps {
  onSelectVessel?: (vessel: LiveLocation | null) => void;
  dateFrom?: Date;
  dateTo?: Date;
  selectedTripId?: string;
  liveLocations?: LiveLocation[];
  centerOnLiveLocations?: boolean;
  onCenterOnLiveLocations?: () => void;
}

export interface TripsTableProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  loading?: boolean;
}

export interface DateRangeSelectorProps {
  dateFrom: Date;
  dateTo: Date;
  onDateChange: (dateFrom: Date, dateTo: Date) => void;
}

// Map-specific types
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface MobileTooltip {
  object: TripPoint | LiveLocation | { tripId: string; path: number[]; name?: string } | { count: number; position?: [number, number] } | null;
  x: number;
  y: number;
  visible: boolean;
}

// API types
export interface TripPointsParams {
  dateFrom: Date;
  dateTo: Date;
  imeis: string[];
  includeDeviceInfo?: boolean;
  includeLastSeen?: boolean;
}

export interface TripsParams {
  dateFrom: Date;
  dateTo: Date;
  imeis: string[];
  includeDeviceInfo?: boolean;
  includeLastSeen?: boolean;
}

// Statistics types
export interface VesselInsights {
  activeTrips: number;
  totalDistance: number;
  avgSpeed: number;
}

// Color types
export type RGB = [number, number, number];

// GPS coordinate types
export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy in meters
  timestamp: string; // When GPS coordinate was captured
}

// Catch reporting types
export interface CatchEvent {
  _id?: string;
  tripId: string;
  date: string;
  fishGroup?: FishGroup; // Optional for no-catch events
  quantity?: number; // Optional for no-catch events
  photos?: string[]; // Base64 encoded photos
  gps_photo?: GPSCoordinate[]; // GPS coordinates for each photo (same index as photos array)
  catch_outcome: number; // 1 = has catch, 0 = no catch
  imei: string;
  boatName?: string;
  community?: string;
  reportedAt: string;
}

export type FishGroup = 'reef fish' | 'sharks/rays' | 'small pelagics' | 'large pelagics' | 'tuna/tuna-like';

export interface CatchEntry {
  fishGroup: FishGroup;
  quantity: number;
  id: string; // For managing multiple entries
  photos?: string[]; // Base64 encoded photos
  gps_photo?: GPSCoordinate[]; // GPS coordinates for each photo (same index as photos array)
}

export interface CatchEventFormData {
  tripId: string;
  date: Date;
  fishGroup: FishGroup;
  quantity: number;
  photos?: string[]; // Base64 encoded photos
  gps_photo?: GPSCoordinate[]; // GPS coordinates for each photo (same index as photos array)
}

export interface MultipleCatchFormData {
  tripId: string;
  date: Date;
  catches: CatchEntry[];
  noCatch: boolean;
} 