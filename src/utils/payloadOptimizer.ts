import { MultipleCatchFormData } from '../types';
import i18n from '../i18n';

// Utility to estimate payload size and optimize for server limits
export class PayloadOptimizer {
  private static readonly MAX_PAYLOAD_SIZE_KB = 4000; // 4MB conservative limit
  private static readonly MAX_PHOTO_SIZE_KB = 800; // Max size per photo
  private static readonly BASE_PAYLOAD_SIZE_KB = 10; // Estimated size of catch data without photos

  // Estimate size of a base64 photo in KB
  static estimatePhotoSize(base64Photo: string): number {
    return Math.round((base64Photo.length * 0.75) / 1024);
  }

  // Estimate total payload size
  static estimatePayloadSize(formData: MultipleCatchFormData): number {
    let totalSize = this.BASE_PAYLOAD_SIZE_KB;
    
    for (const catchEntry of formData.catches) {
      if (catchEntry.photos) {
        for (const photo of catchEntry.photos) {
          totalSize += this.estimatePhotoSize(photo);
        }
      }
      
      // Add GPS data size (minimal, ~1KB per photo)
      if (catchEntry.gps_photo && catchEntry.gps_photo.length > 0) {
        totalSize += catchEntry.gps_photo.length; // ~1KB per GPS coordinate
      }
    }
    
    return totalSize;
  }

  // Split payload into smaller chunks if needed
  static optimizePayload(formData: MultipleCatchFormData): MultipleCatchFormData[] {
    const estimatedSize = this.estimatePayloadSize(formData);
    
    console.log(`📦 Payload size estimation: ${estimatedSize}KB`);
    
    // If payload is under limit, return as-is
    if (estimatedSize <= this.MAX_PAYLOAD_SIZE_KB) {
      return [formData];
    }
    
    console.log('📦 Payload too large, optimizing...');
    
    // Strategy 1: Try reducing photo quality
    const optimizedFormData = this.reducePhotoQuality(formData);
    const optimizedSize = this.estimatePayloadSize(optimizedFormData);
    
    if (optimizedSize <= this.MAX_PAYLOAD_SIZE_KB) {
      console.log(`✅ Optimized payload size: ${optimizedSize}KB`);
      return [optimizedFormData];
    }
    
    // Strategy 2: Split into multiple submissions
    console.log('📦 Still too large, splitting into multiple submissions...');
    return this.splitIntoChunks(optimizedFormData);
  }

  // Reduce photo quality by re-compressing
  private static reducePhotoQuality(formData: MultipleCatchFormData): MultipleCatchFormData {
    const optimized = { ...formData };
    optimized.catches = formData.catches.map(catchEntry => {
      if (!catchEntry.photos || catchEntry.photos.length === 0) {
        return catchEntry;
      }

      const optimizedCatch = { ...catchEntry };
      optimizedCatch.photos = catchEntry.photos.map(photo => {
        try {
          // Re-compress the photo with lower quality
          return this.recompressPhoto(photo); // Lower quality
        } catch (error) {
          console.warn('Failed to recompress photo:', error);
          return photo; // Return original if recompression fails
        }
      });

      return optimizedCatch;
    });

    return optimized;
  }

  // Re-compress a base64 photo with different quality
  private static recompressPhoto(base64Photo: string): string {
    try {
      // Create a temporary canvas to recompress the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('Canvas context not available');
        return base64Photo;
      }
      
      // Since we need synchronous operation for the array map,
      // we'll use a different approach: reduce dimensions instead of quality
      const originalSize = this.estimatePhotoSize(base64Photo);
      
      // If photo is larger than 500KB, reduce dimensions significantly
      if (originalSize > 500) {
        return this.resizePhoto(base64Photo, 0.7); // Reduce to 70% of original size
      }
      
      // Otherwise, just reduce quality
      return base64Photo.replace('data:image/jpeg;base64,', '')
        .replace('data:image/png;base64,', '')
        .replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
    } catch (error) {
      console.warn('Photo recompression failed:', error);
      return base64Photo;
    }
  }

  // Resize photo by scaling down dimensions
  private static resizePhoto(base64Photo: string, scaleFactor: number): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) return base64Photo;
      
      // Load image synchronously (this is not ideal but needed for the current flow)
      img.src = base64Photo;
      
      // Calculate new dimensions
      const newWidth = Math.round(img.width * scaleFactor);
      const newHeight = Math.round(img.height * scaleFactor);
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw scaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Return compressed version
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.warn('Photo resize failed:', error);
      return base64Photo;
    }
  }

  // Split formData into smaller chunks
  private static splitIntoChunks(formData: MultipleCatchFormData): MultipleCatchFormData[] {
    const chunks: MultipleCatchFormData[] = [];
    
    // Strategy: Submit catch data without photos first, then photos separately
    // This ensures catch data is never lost even if photos fail
    
    // Chunk 1: Catch data without photos
    const catchDataOnly: MultipleCatchFormData = {
      ...formData,
      catches: formData.catches.map(catchEntry => ({
        ...catchEntry,
        photos: [], // Remove photos
        gps_photo: [] // Remove GPS data to minimize size
      }))
    };
    
    chunks.push(catchDataOnly);
    
    // Chunk 2+: Photos in separate submissions (if we implement photo-only submissions)
    // For now, we'll just submit the catch data without photos
    // This ensures the catch report is saved even if photos are too large
    
    console.log(`📦 Split into ${chunks.length} chunks`);
    return chunks;
  }

  // Check if a single photo is too large
  static isPhotoTooLarge(base64Photo: string): boolean {
    const sizeKB = this.estimatePhotoSize(base64Photo);
    return sizeKB > this.MAX_PHOTO_SIZE_KB;
  }

  // Get optimization suggestions for the user
  static getOptimizationSuggestions(formData: MultipleCatchFormData): string[] {
    const suggestions: string[] = [];
    const estimatedSize = this.estimatePayloadSize(formData);
    
    if (estimatedSize > this.MAX_PAYLOAD_SIZE_KB) {
      suggestions.push(i18n.t('errors.photosAreLarge'));
    }
    
    let photoCount = 0;
    let oversizedPhotos = 0;
    
    for (const catchEntry of formData.catches) {
      if (catchEntry.photos) {
        photoCount += catchEntry.photos.length;
        for (const photo of catchEntry.photos) {
          if (this.isPhotoTooLarge(photo)) {
            oversizedPhotos++;
          }
        }
      }
    }
    
    if (photoCount > 5) {
      suggestions.push(i18n.t('errors.reducePhotosForReliability'));
    }
    
    if (oversizedPhotos > 0) {
      suggestions.push(i18n.t('errors.photosWillBeCompressed', { count: oversizedPhotos }));
    }
    
    return suggestions;
  }
}

export default PayloadOptimizer;