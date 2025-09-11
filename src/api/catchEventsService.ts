import { CatchEvent, CatchEventFormData, MultipleCatchFormData } from '../types';
import i18n from '../i18n';
import { isDemoMode, isAdminMode } from '../utils/demoData';


// API URL - dynamically set based on environment
const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment 
  ? 'http://localhost:3001/api' 
  : '/api';

/**
 * Submit a catch event report (with catch outcome support)
 */
export async function submitCatchEvent(catchData: CatchEventFormData, imei: string, catchOutcome: number = 1): Promise<CatchEvent> {
  // Check if we're in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: simulating catch event submission');
    // Return a mock successful response
    return {
      _id: `demo-catch-${Date.now()}`,
      tripId: catchData.tripId,
      fishGroup: catchData.fishGroup,
      quantity: catchData.quantity,
      date: catchData.date.toISOString(),
      reportedAt: new Date().toISOString(),
      imei,
      catch_outcome: catchOutcome,
      photos: catchData.photos || [],
      gps_photo: catchData.gps_photo
    };
  }

  try {
    const payload = {
      tripId: catchData.tripId,
      date: catchData.date.toISOString(),
      catch_outcome: catchOutcome,
      imei,
      // Include admin flag to protect real data
      isAdmin: isAdminMode(),
      // Only include fishGroup and quantity for actual catches (catch_outcome = 1)
      ...(catchOutcome === 1 && {
        fishGroup: catchData.fishGroup,
        quantity: catchData.quantity,
        photos: catchData.photos,
        gps_photo: catchData.gps_photo
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
      let errorMessage = i18n.t('api.failedToSubmitCatch', { status: response.status });
      
      // Handle specific HTTP status codes
      if (response.status === 413) {
        errorMessage = i18n.t('api.payloadTooLargeError');
      } else if (response.status === 400) {
        errorMessage = i18n.t('api.invalidDataError');
      } else if (response.status === 500) {
        errorMessage = i18n.t('api.serverError');
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
      }
      
      throw new Error(errorMessage);
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
  // Check if we're in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: simulating no-catch event submission');
    return {
      _id: `demo-no-catch-${Date.now()}`,
      tripId,
      quantity: 0,
      date: date.toISOString(),
      reportedAt: new Date().toISOString(),
      imei,
      catch_outcome: 0,
      photos: [],
      gps_photo: undefined
    };
  }

  try {
    const payload = {
      tripId,
      date: date.toISOString(),
      catch_outcome: 0,
      imei,
      // Include admin flag to protect real data
      isAdmin: isAdminMode()
    };

    const response = await fetch(`${API_URL}/catch-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: i18n.t('api.unknownError') }));
      throw new Error(errorData.error || i18n.t('api.failedToSubmitNoCatch', { status: response.status }));
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
      throw new Error(i18n.t('api.failedToFetchCatchEvents', { status: response.status }));
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
      throw new Error(i18n.t('api.failedToFetchUserCatchEvents', { status: response.status }));
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
  // Check if we're in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: simulating multiple catch events submission');
    const results: CatchEvent[] = [];
    
    if (formData.noCatch) {
      results.push({
        _id: `demo-no-catch-${Date.now()}`,
        tripId: formData.tripId,
        quantity: 0,
        date: formData.date.toISOString(),
        reportedAt: new Date().toISOString(),
        imei,
        catch_outcome: 0,
        photos: [],
        gps_photo: undefined
      });
    } else {
      formData.catches.forEach((catchData, index) => {
        if (catchData.quantity > 0) {
          results.push({
            _id: `demo-catch-${Date.now()}-${index}`,
            tripId: formData.tripId,
            fishGroup: catchData.fishGroup,
            quantity: catchData.quantity,
            date: formData.date.toISOString(),
            reportedAt: new Date().toISOString(),
            imei,
            catch_outcome: 1,
            photos: catchData.photos || [],
            gps_photo: catchData.gps_photo
          });
        }
      });
    }
    
    return results;
  }

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
          photos: catchEntry.photos,
          gps_photo: catchEntry.gps_photo
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