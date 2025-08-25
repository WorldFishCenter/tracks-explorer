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

  // Get current GPS coordinates - simplified for Android smartphone compatibility
  const getCurrentGPSCoordinate = (): Promise<GPSCoordinate | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation not supported');
        resolve(null);
        return;
      }

      console.log('📍 Requesting GPS location...');
      // Directly call getCurrentPosition to trigger permission prompt on Android smartphones
      requestGPSLocationWithFallback(resolve);
    });
  };

  // Simplified GPS location request - network first, then GPS fallback  
  const requestGPSLocationWithFallback = (resolve: (value: GPSCoordinate | null) => void) => {
    console.log('📍 Attempting location request (network first)...');
    
    // First try network-based location - this should trigger permission prompt on Android
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Location obtained:', {
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
      (error) => {
        console.warn('⚠️ Network location failed, trying GPS:', error.message);
        
        // If permission was denied, don't retry
        if (error.code === error.PERMISSION_DENIED) {
          console.warn('⚠️ Permission denied');
          resolve(null);
          return;
        }
        
        // Otherwise, try high accuracy GPS
        attemptHighAccuracyGPS(resolve);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000
      }
    );
  };

  // Fallback function for high accuracy GPS
  const attemptHighAccuracyGPS = (resolve: (value: GPSCoordinate | null) => void) => {
    console.log('📍 Attempting high-accuracy GPS...');
    
    const highAccuracyTimeoutId = setTimeout(() => {
      console.warn('⚠️ GPS timeout after 15 seconds');
      resolve(null);
    }, 15000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(highAccuracyTimeoutId);
        console.log('📍 GPS coordinates obtained:', {
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
      (error) => {
        clearTimeout(highAccuracyTimeoutId);
        let errorMessage = 'Unknown GPS error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'GPS permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'GPS position unavailable. Please check your device GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'GPS request timed out. Please try again.';
            break;
          default:
            errorMessage = `GPS error: ${error.message}`;
        }
        
        console.warn('⚠️ GPS error:', errorMessage);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0 // Force fresh GPS reading
      }
    );
  };

  // Handle photo upload from file
  const handleFileUpload = async (catchEntryId: string, file: File) => {
    try {
      
      // Check file size (10MB limit - modern phones can have large photos)
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

      // Start image compression and GPS capture (if enabled) in parallel
      
      let gpsCoordinate: GPSCoordinate | null = null;
      
      if (gpsLocationEnabled) {
        gpsCoordinate = await getCurrentGPSCoordinate();
      }
      
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

  return {
    cameraSupported,
    fileInputRefs,
    checkCameraSupport,
    handleFileUpload,
    triggerFileInput,
    removePhoto: onPhotoRemove
  };
};