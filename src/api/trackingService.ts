// This file will implement API methods to fetch vessel tracking data
// Placeholder implementation with mock data until the real API is provided

import { EXAMPLE_VESSEL_DATA, VesselData } from './mockData.js';

export interface TrackingFilter {
  startDate?: Date;
  endDate?: Date;
  vesselIds?: string[];
  region?: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
}

// Mock implementation for now
export const getVesselData = async (filter?: TrackingFilter): Promise<VesselData[]> => {
  // Simulate API call with delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // This will be replaced with actual API call when available
  return EXAMPLE_VESSEL_DATA;
};

export const getVesselById = async (id: string): Promise<VesselData | null> => {
  // Simulate API call with delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // This will be replaced with actual API call when available
  return EXAMPLE_VESSEL_DATA.find((vessel: VesselData) => vessel.id === id) || null;
};

// Additional methods will be added when the real API is provided
export const getVesselHistory = async (id: string, startDate: Date, endDate: Date): Promise<VesselData | null> => {
  // Simulate API call with delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  // This will be replaced with actual API call when available
  const vessel = EXAMPLE_VESSEL_DATA.find((v: VesselData) => v.id === id);
  return vessel || null;
}; 