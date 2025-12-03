import { Waypoint, WaypointFormData } from '../types';

// API URL - Use relative path to leverage Vite proxy in development
const API_URL = '/api';

/**
 * Fetch all waypoints for a user
 */
export async function fetchWaypoints(userId: string): Promise<Waypoint[]> {
  try {
    const url = `${API_URL}/waypoints?userId=${encodeURIComponent(userId)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch waypoints: ${response.status}`);
    }

    const waypoints = await response.json();
    return waypoints;
  } catch (error) {
    console.error('Error fetching waypoints:', error);
    throw error;
  }
}

/**
 * Create a new waypoint
 */
export async function createWaypoint(
  userId: string,
  data: WaypointFormData,
  imei?: string,
  username?: string
): Promise<Waypoint> {
  try {
    const payload = {
      userId,
      imei: imei || null,
      username: username || null,
      name: data.name,
      description: data.description || null,
      coordinates: data.coordinates,
      type: data.type,
      metadata: {
        deviceInfo: navigator.userAgent,
        accuracy: null
      }
    };

    const response = await fetch(`${API_URL}/waypoints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to create waypoint: ${response.status}`);
    }

    const waypoint = await response.json();
    return waypoint;
  } catch (error) {
    console.error('Error creating waypoint:', error);
    throw error;
  }
}

/**
 * Update an existing waypoint
 */
export async function updateWaypoint(
  waypointId: string,
  userId: string,
  data: Partial<WaypointFormData>
): Promise<Waypoint> {
  try {
    const payload = {
      userId,
      ...data
    };

    const response = await fetch(`${API_URL}/waypoints/${waypointId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to update waypoint: ${response.status}`);
    }

    const waypoint = await response.json();
    return waypoint;
  } catch (error) {
    console.error('Error updating waypoint:', error);
    throw error;
  }
}

/**
 * Delete a waypoint
 */
export async function deleteWaypoint(
  waypointId: string,
  userId: string
): Promise<void> {
  try {
    const response = await fetch(
      `${API_URL}/waypoints/${waypointId}?userId=${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to delete waypoint: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting waypoint:', error);
    throw error;
  }
}
