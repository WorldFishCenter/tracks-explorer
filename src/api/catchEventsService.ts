import { CatchEvent, CatchEventFormData, MultipleCatchFormData } from '../types';

// API URL - dynamically set based on environment
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * Submit a catch event report (with catch outcome support)
 */
export async function submitCatchEvent(catchData: CatchEventFormData, imei: string, catchOutcome: number = 1): Promise<CatchEvent> {
  try {
    const payload = {
      tripId: catchData.tripId,
      date: catchData.date.toISOString(),
      catch_outcome: catchOutcome,
      imei,
      // Only include fishGroup and quantity for actual catches (catch_outcome = 1)
      ...(catchOutcome === 1 && {
        fishGroup: catchData.fishGroup,
        quantity: catchData.quantity,
        photos: catchData.photos
      })
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
 * Submit a no-catch event report
 */
export async function submitNoCatchEvent(tripId: string, date: Date, imei: string): Promise<CatchEvent> {
  try {
    const payload = {
      tripId,
      date: date.toISOString(),
      catch_outcome: 0,
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
      throw new Error(errorData.error || `Failed to submit no-catch report: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting no-catch event:', error);
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
      // Submit a proper no-catch event
      console.log('Submitting no-catch event for trip:', formData.tripId);
      const noCatchEvent = await submitNoCatchEvent(formData.tripId, formData.date, imei);
      return [noCatchEvent];
    }

    // Submit multiple catch events
    const results: CatchEvent[] = [];
    for (const catchEntry of formData.catches) {
      if (catchEntry.quantity > 0) { // Only submit catches with positive quantities
        const catchData: CatchEventFormData = {
          tripId: formData.tripId,
          date: formData.date,
          fishGroup: catchEntry.fishGroup,
          quantity: catchEntry.quantity,
          photos: catchEntry.photos
        };
        const result = await submitCatchEvent(catchData, imei, 1); // Explicitly set catch_outcome = 1
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Error submitting multiple catch events:', error);
    throw error;
  }
}