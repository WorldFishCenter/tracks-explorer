import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GPSCoordinate } from '../../../types';

export interface UsePhotoHandlingProps {
  onError: (error: string) => void;
  onPhotoAdd: (catchEntryId: string, base64Photo: string, gpsCoordinate?: GPSCoordinate) => void;
  onPhotoRemove: (catchEntryId: string, photoIndex: number) => void;
  gpsLocationEnabled?: boolean;
}

export const usePhotoHandling = ({ onError, onPhotoAdd, onPhotoRemove, gpsLocationEnabled = false }: UsePhotoHandlingProps) => {
  const { t } = useTranslation();
  const [cameraSupported, setCameraSupported] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Check camera support
  const checkCameraSupport = async () => {
    try {
      if (navigator.mediaDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        setCameraSupported(hasVideoInput);
      }
    } catch (error) {
      console.log('Camera not supported:', error);
      setCameraSupported(false);
    }
  };

  // Compress image to base64
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with quality compression
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error(t('catch.photoError')));
      img.src = URL.createObjectURL(file);
    });
  };

  // Check if we're on Android
  const isAndroid = (): boolean => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('android');
  };

  // Check if HTTPS (required for geolocation on Android)
  const isSecureContext = (): boolean => {
    return window.isSecureContext || 
           location.protocol === 'https:' || 
           location.hostname === 'localhost' ||
           location.hostname === '127.0.0.1';
  };

  // Get current GPS coordinates - Android-optimized version
  const getCurrentGPSCoordinate = (): Promise<GPSCoordinate | null> => {
    return new Promise((resolve) => {
      // Security context check
      if (!isSecureContext()) {
        console.warn('⚠️ Geolocation requires HTTPS');
        resolve(null);
        return;
      }

      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation not supported');
        resolve(null);
        return;
      }

      // Check existing permission state if available
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          console.log('📍 Permission state:', result.state);
          
          if (result.state === 'denied') {
            console.warn('⚠️ Location permission previously denied');
            resolve(null);
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

  // Main GPS location request - Android optimized
  const requestGPSLocation = (resolve: (value: GPSCoordinate | null) => void) => {
    const isAndroidDevice = isAndroid();
    console.log('📍 Requesting location...', { isAndroid: isAndroidDevice });

    // Android-specific options
    const androidOptions: PositionOptions = {
      enableHighAccuracy: true,  // Android works better with high accuracy from start
      timeout: 20000,            // Longer timeout for Android
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
      resolve(null);
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
        resolve(gpsCoordinate);
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
              resolve(gpsCoordinate);
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

  // Handle location errors
  const handleLocationError = (error: GeolocationPositionError, resolve: (value: GPSCoordinate | null) => void) => {
    let errorMessage = 'Unknown GPS error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'GPS permission denied. Please enable location access in your browser/app settings.';
        // On Android, sometimes need to guide user to app settings
        if (isAndroid()) {
          errorMessage += ' On Android: Settings > Apps > [Your Browser/PWA] > Permissions > Location';
        }
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'GPS position unavailable. Please ensure GPS is enabled on your device.';
        break;
      case error.TIMEOUT:
        errorMessage = 'GPS request timed out. Please try again or check your GPS settings.';
        break;
      default:
        errorMessage = `GPS error: ${error.message}`;
    }
    
    console.warn('⚠️ Location error:', errorMessage);
    resolve(null);
  };

  // Handle photo upload from file
  const handleFileUpload = async (catchEntryId: string, file: File) => {
    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.error('❌ File too large:', file.size, 'bytes');
        onError(t('catch.photoTooLarge'));
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        onError(t('catch.photoError'));
        return;
      }

      // For Android, request GPS permission early if needed
      let gpsCoordinate: GPSCoordinate | null = null;
      
      if (gpsLocationEnabled) {
        // On Android, sometimes the permission needs to be triggered by user action
        // The file upload itself is a user action, so this timing works better
        console.log('📍 GPS enabled, requesting location after user action...');
        
        // Small delay on Android to ensure permission prompt shows
        if (isAndroid()) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        gpsCoordinate = await getCurrentGPSCoordinate();
        
        if (!gpsCoordinate && isAndroid()) {
          console.log('💡 Tip: If location fails on Android, try: Settings > Apps > Browser > Permissions > Location');
        }
      }
      
      // Compress image
      const base64 = await compressImage(file);
      
      onPhotoAdd(catchEntryId, base64, gpsCoordinate || undefined);
    } catch (err) {
      console.error('❌ Photo upload error:', err);
      onError(t('catch.photoError'));
    }
  };

  // Trigger file input for specific catch entry
  const triggerFileInput = (catchEntryId: string) => {
    fileInputRefs.current[catchEntryId]?.click();
  };

  // Initialize GPS permission on mount (for Android)
  const initializeGPSPermission = async () => {
    if (gpsLocationEnabled && isAndroid() && 'permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        console.log('📍 Initial GPS permission state:', result.state);
        
        // If prompt, we might want to request once to trigger the permission dialog
        if (result.state === 'prompt') {
          console.log('📍 Pre-warming GPS permission...');
          // Don't await this, just trigger it
          getCurrentGPSCoordinate();
        }
      } catch (e) {
        console.log('📍 Could not check permission state:', e);
      }
    }
  };

  return {
    cameraSupported,
    fileInputRefs,
    checkCameraSupport,
    handleFileUpload,
    triggerFileInput,
    removePhoto: onPhotoRemove,
    initializeGPSPermission  // Export this for component to call on mount
  };
};