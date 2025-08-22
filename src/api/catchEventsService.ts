import { CatchEvent, CatchEventFormData, MultipleCatchFormData, CatchEntry } from '../types';

// API URL - dynamically set based on environment
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * Submit a catch event report
 */
export async function submitCatchEvent(catchData: CatchEventFormData, imei: string): Promise<CatchEvent> {
  try {
    const payload = {
      tripId: catchData.tripId,
      date: catchData.date.toISOString(),
      fishGroup: catchData.fishGroup,
      quantity: catchData.quantity,
      imei
    };

    const response = await fetch(`${API_URL}/catch-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to submit catch report: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting catch event:', error);
    throw error;
  }
}

/**
 * Get catch events for a specific trip
 */
export async function getCatchEventsByTrip(tripId: string): Promise<CatchEvent[]> {
  try {
    // In development, use Express server paths; in production, use query parameters for Vercel
    const url = isDevelopment 
      ? `${API_URL}/catch-events/trip/${tripId}`
      : `${API_URL}/catch-events?tripId=${encodeURIComponent(tripId)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch catch events: ${response.status}`);
    }
    
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('Error fetching catch events:', error);
    throw error;
  }
}

/**
 * Get catch events for a user (by IMEI)
 */
export async function getCatchEventsByUser(imei: string): Promise<CatchEvent[]> {
  try {
    // In development, use Express server paths; in production, use query parameters for Vercel
    const url = isDevelopment 
      ? `${API_URL}/catch-events/user/${imei}`
      : `${API_URL}/catch-events?imei=${encodeURIComponent(imei)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user catch events: ${response.status}`);
    }
    
    const events = await response.json();
    return events;
  } catch (error) {
    console.error('Error fetching user catch events:', error);
    throw error;
  }
}

/**
 * Submit multiple catch events for a single trip
 */
export async function submitMultipleCatchEvents(formData: MultipleCatchFormData, imei: string): Promise<CatchEvent[]> {
  try {
    if (formData.noCatch) {
      // Skip API submission for no catch - return empty array
      // TODO: Implement proper no-catch handling when API supports it
      console.log('No catch reported - skipping API submission');
      return [];
    }

    // Submit multiple catch events
    const results: CatchEvent[] = [];
    for (const catchEntry of formData.catches) {
      if (catchEntry.quantity > 0) { // Only submit catches with positive quantities
        const catchData: CatchEventFormData = {
          tripId: formData.tripId,
          date: formData.date,
          fishGroup: catchEntry.fishGroup,
          quantity: catchEntry.quantity
        };
        const result = await submitCatchEvent(catchData, imei);
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Error submitting multiple catch events:', error);
    throw error;
  }
}