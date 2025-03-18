// Mock data for development purposes until real API is integrated

export interface VesselData {
  id: string;
  name: string;
  path: number[][];  // Array of [longitude, latitude, timestamp] coordinates
  color: number[];   // RGB color
  radius: number;
}

export const EXAMPLE_VESSEL_DATA: VesselData[] = [
  {
    id: '1',
    name: 'Fishing Vessel 1',
    path: [
      [-74.006, 40.7128, 0], // Example coordinates: [lng, lat, timestamp]
      [-74.004, 40.7135, 1],
      [-74.002, 40.7140, 2],
      [-74.001, 40.7145, 3],
    ],
    color: [255, 0, 0],
    radius: 300
  },
  {
    id: '2',
    name: 'Fishing Vessel 2',
    path: [
      [-74.01, 40.72, 0],
      [-74.015, 40.725, 1],
      [-74.02, 40.728, 2],
      [-74.025, 40.73, 3],
    ],
    color: [0, 0, 255],
    radius: 300
  },
  {
    id: '3',
    name: 'Fishing Vessel 3',
    path: [
      [-74.03, 40.74, 0],
      [-74.025, 40.743, 1],
      [-74.02, 40.745, 2],
      [-74.015, 40.747, 3],
    ],
    color: [0, 255, 0],
    radius: 300
  }
];

export const VESSEL_DETAILS = {
  '1': {
    id: '1',
    name: 'Fishing Vessel 1',
    captain: 'John Smith',
    registration: 'FV-12345',
    lastUpdate: '2023-03-17 14:30',
    status: 'active',
    fishing: true,
    speed: 8.5
  },
  '2': {
    id: '2',
    name: 'Fishing Vessel 2',
    captain: 'Jane Doe',
    registration: 'FV-67890',
    lastUpdate: '2023-03-17 14:25',
    status: 'docked',
    fishing: false,
    speed: 0
  },
  '3': {
    id: '3',
    name: 'Fishing Vessel 3',
    captain: 'Robert Johnson',
    registration: 'FV-54321',
    lastUpdate: '2023-03-17 14:15',
    status: 'active',
    fishing: true,
    speed: 6.2
  }
}; 