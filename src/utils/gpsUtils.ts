import { GPSCoordinate } from '../types';

export interface GPSResult {
  coordinate: GPSCoordinate | null;
  error?: {
    code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'NOT_SECURE' | 'UNKNOWN';
    message: string;
  };
}

/**
 * Check if we're on Android
 */
const isAndroid = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('android');
};

/**
 * Check if Android smartphone (not tablet)
 */
const isAndroidSmartphone = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  // Android phones typically have "mobile" in UA, tablets don't
  return ua.includes('android') && ua.includes('mobile');
};

/**
 * Check if HTTPS (required for geolocation on Android)
 */
const isSecureContext = (): boolean => {
  return window.isSecureContext ||
         location.protocol === 'https:' ||
         location.hostname === 'localhost' ||
         location.hostname === '127.0.0.1';
};

/**
 * Handle location errors
 */
const handleLocationError = (error: GeolocationPositionError, resolve: (value: GPSResult) => void) => {
  let errorCode: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'NOT_SECURE' | 'UNKNOWN' = 'UNKNOWN';
  let errorMessage = 'Unknown GPS error';

  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorCode = 'PERMISSION_DENIED';
      errorMessage = 'gps.permissionDenied';
      if (isAndroid()) {
        console.warn('📱 Android GPS Permission Denied. Common fixes:');
        console.warn('1. Check Chrome Settings > Site settings > Location');
        console.warn('2. Check Android Settings > Location > App permissions');
        console.warn('3. Disable battery optimization for Chrome');
        console.warn('4. Ensure Location Mode is "High accuracy"');
      }
      break;
    case error.POSITION_UNAVAILABLE:
      errorCode = 'POSITION_UNAVAILABLE';
      errorMessage = 'gps.positionUnavailable';
      if (isAndroid()) {
        console.warn('📱 Android GPS Unavailable. Check:');
        console.warn('1. Location services are ON');
        console.warn('2. Not in Airplane mode');
        console.warn('3. Location mode is not "Device only"');
        console.warn('4. Google Play Services is updated');
      }
      break;
    case error.TIMEOUT:
      errorCode = 'TIMEOUT';
      errorMessage = 'gps.timeout';
      if (isAndroid()) {
        console.warn('📱 Android GPS Timeout. This often means:');
        console.warn('1. Weak GPS signal (try outdoors)');
        console.warn('2. Power saving mode is ON');
        console.warn('3. Location mode is "Battery saving" instead of "High accuracy"');
      }
      break;
    default:
      errorCode = 'UNKNOWN';
      errorMessage = 'gps.unknownError';
  }

  console.warn('⚠️ Location error:', errorMessage);
  resolve({
    coordinate: null,
    error: {
      code: errorCode,
      message: errorMessage
    }
  });
};

/**
 * Main GPS location request - Android optimized
 */
const requestGPSLocation = (resolve: (value: GPSResult) => void) => {
  const isAndroidDevice = isAndroid();
  const isSmartphone = isAndroidSmartphone();
  console.log('📍 Requesting location...', {
    isAndroid: isAndroidDevice,
    isSmartphone: isSmartphone
  });

  // Android-specific options
  const androidOptions: PositionOptions = {
    enableHighAccuracy: true,  // Android works better with high accuracy from start
    timeout: isSmartphone ? 30000 : 20000,  // Even longer timeout for smartphones (30s)
    maximumAge: 0              // Force fresh reading on Android
  };

  // iOS/Desktop options
  const defaultOptions: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 300000
  };

  const options = isAndroidDevice ? androidOptions : defaultOptions;

  // Set up timeout handler
  const timeoutId = setTimeout(() => {
    console.warn('⚠️ Location request timed out');
    resolve({
      coordinate: null,
      error: {
        code: 'TIMEOUT',
        message: 'gps.timeout'
      }
    });
  }, options.timeout! + 1000);

  // Single attempt with appropriate options
  navigator.geolocation.getCurrentPosition(
    (position) => {
      clearTimeout(timeoutId);
      console.log('✅ Location obtained:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        method: options.enableHighAccuracy ? 'GPS' : 'Network'
      });

      const gpsCoordinate: GPSCoordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      resolve({
        coordinate: gpsCoordinate,
        error: undefined
      });
    },
    (error) => {
      clearTimeout(timeoutId);

      // On Android, if high accuracy fails, try with network
      if (isAndroidDevice && options.enableHighAccuracy && error.code !== error.PERMISSION_DENIED) {
        console.log('📍 Retrying with network location...');

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Network location obtained:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });

            const gpsCoordinate: GPSCoordinate = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };
            resolve({
              coordinate: gpsCoordinate,
              error: undefined
            });
          },
          (retryError) => {
            handleLocationError(retryError, resolve);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        handleLocationError(error, resolve);
      }
    },
    options
  );
};

/**
 * Get current GPS coordinates from device - Android-optimized version
 * Reusable utility function for getting device location
 */
export const getCurrentGPSCoordinate = (): Promise<GPSResult> => {
  return new Promise((resolve) => {
    // Security context check
    if (!isSecureContext()) {
      console.warn('⚠️ Geolocation requires HTTPS');
      resolve({
        coordinate: null,
        error: {
          code: 'NOT_SECURE',
          message: 'gps.permissionDenied'
        }
      });
      return;
    }

    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported');
      resolve({
        coordinate: null,
        error: {
          code: 'NOT_SUPPORTED',
          message: 'gps.unknownError'
        }
      });
      return;
    }

    // Check existing permission state if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('📍 Permission state:', result.state);

        if (result.state === 'denied') {
          console.warn('⚠️ Location permission previously denied');
          resolve({
            coordinate: null,
            error: {
              code: 'PERMISSION_DENIED',
              message: 'gps.permissionDenied'
            }
          });
          return;
        }

        // Proceed with location request
        requestGPSLocation(resolve);
      }).catch(() => {
        // Permissions API not supported, try anyway
        requestGPSLocation(resolve);
      });
    } else {
      requestGPSLocation(resolve);
    }
  });
};
