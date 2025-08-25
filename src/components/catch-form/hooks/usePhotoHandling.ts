import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GPSCoordinate } from '../../../types';

export interface UsePhotoHandlingProps {
  onError: (error: string) => void;
  onPhotoAdd: (catchEntryId: string, base64Photo: string, gpsCoordinate?: GPSCoordinate) => void;
  onPhotoRemove: (catchEntryId: string, photoIndex: number) => void;
}

export const usePhotoHandling = ({ onError, onPhotoAdd, onPhotoRemove }: UsePhotoHandlingProps) => {
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

  // Get current GPS coordinates
  const getCurrentGPSCoordinate = (): Promise<GPSCoordinate | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocation not supported');
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.warn('⚠️ GPS timeout after 10 seconds');
        resolve(null);
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
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
          console.warn('⚠️ GPS error:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000 // Accept cached position up to 5 minutes old
        }
      );
    });
  };

  // Handle photo upload from file
  const handleFileUpload = async (catchEntryId: string, file: File) => {
    try {
      console.log('📸 Photo upload started:', { catchEntryId, fileName: file.name, fileSize: file.size, fileType: file.type });
      
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

      // Start GPS capture and image compression in parallel
      console.log('🔄 Starting GPS capture and image compression...');
      const [base64, gpsCoordinate] = await Promise.all([
        compressImage(file),
        getCurrentGPSCoordinate()
      ]);
      
      console.log('✅ Image compressed successfully, length:', base64.length);
      
      console.log('📤 Adding photo to catch entry...');
      onPhotoAdd(catchEntryId, base64, gpsCoordinate || undefined);
      console.log('✅ Photo added to catch entry:', catchEntryId);
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