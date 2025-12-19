import { MultipleCatchFormData, GPSCoordinate, WaypointFormData, TripPoint, LiveLocation } from '../types';

interface PhotoRecord {
  id?: number;
  catchEntryId: string;
  data: string;
  gps?: GPSCoordinate;
  timestamp: string;
}

interface CatchRecord {
  id?: number;
  formData: MultipleCatchFormData;
  imei: string | null;
  username: string | null;
  timestamp: string;
  submitted?: boolean;
  retryCount?: number;
  lastError?: string | null;
}

interface WaypointRecord {
  id?: number;
  userId: string;
  imei?: string;
  username?: string;
  formData: WaypointFormData;
  timestamp: string;
  submitted?: boolean;
  retryCount?: number;
  lastError?: string | null;
}

interface TripDataCache {
  id?: number;
  imei: string;
  tripPoints: TripPoint[];
  cachedAt: string;
  dateFrom: string;
  dateTo: string;
}

interface LiveLocationCache {
  id?: number;
  imei: string;
  location: LiveLocation;
  cachedAt: string;
}

interface UploadQueueItem {
  id?: number;
  type: 'photo' | 'catch' | 'waypoint';
  data: MultipleCatchFormData | WaypointFormData;
  priority: number;
  createdAt: string;
  attempts?: number;
}

// IndexedDB wrapper for offline photo, catch, waypoint, trip, and location data storage
export class OfflineStorage {
  private dbName = 'TracksExplorerDB';
  private version = 3; // Incremented for trip and location cache stores
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for pending photo uploads
        if (!db.objectStoreNames.contains('pendingPhotos')) {
          const photoStore = db.createObjectStore('pendingPhotos', { keyPath: 'id', autoIncrement: true });
          photoStore.createIndex('timestamp', 'timestamp', { unique: false });
          photoStore.createIndex('catchEntryId', 'catchEntryId', { unique: false });
        }

        // Store for pending catch submissions
        if (!db.objectStoreNames.contains('pendingCatches')) {
          const catchStore = db.createObjectStore('pendingCatches', { keyPath: 'id', autoIncrement: true });
          catchStore.createIndex('timestamp', 'timestamp', { unique: false });
          catchStore.createIndex('imei', 'imei', { unique: false });
        }

        // Store for pending waypoint submissions
        if (!db.objectStoreNames.contains('pendingWaypoints')) {
          const waypointStore = db.createObjectStore('pendingWaypoints', { keyPath: 'id', autoIncrement: true });
          waypointStore.createIndex('timestamp', 'timestamp', { unique: false });
          waypointStore.createIndex('userId', 'userId', { unique: false });
        }

        // Store for upload queue management
        if (!db.objectStoreNames.contains('uploadQueue')) {
          const queueStore = db.createObjectStore('uploadQueue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('priority', 'priority', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
          queueStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        // Store for cached trip data (offline viewing of historical trips)
        if (!db.objectStoreNames.contains('tripDataCache')) {
          const tripCacheStore = db.createObjectStore('tripDataCache', { keyPath: 'id', autoIncrement: true });
          tripCacheStore.createIndex('imei', 'imei', { unique: false });
          tripCacheStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Store for cached live locations (last known positions)
        if (!db.objectStoreNames.contains('liveLocationCache')) {
          const liveLocationStore = db.createObjectStore('liveLocationCache', { keyPath: 'id', autoIncrement: true });
          liveLocationStore.createIndex('imei', 'imei', { unique: true }); // One location per IMEI
          liveLocationStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  // Photo storage methods
  async savePhoto(catchEntryId: string, base64Photo: string, gpsCoordinate?: GPSCoordinate): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingPhotos'], 'readwrite');
    const store = transaction.objectStore('pendingPhotos');
    
    const photoData = {
      catchEntryId,
      base64Photo,
      gpsCoordinate,
      timestamp: new Date().toISOString(),
      uploaded: false,
      retryCount: 0
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(photoData);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getPhotosByCatchEntry(catchEntryId: string): Promise<PhotoRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingPhotos'], 'readonly');
    const store = transaction.objectStore('pendingPhotos');
    const index = store.index('catchEntryId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(catchEntryId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markPhotoUploaded(photoId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingPhotos'], 'readwrite');
    const store = transaction.objectStore('pendingPhotos');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(photoId);
      getRequest.onsuccess = () => {
        const photo = getRequest.result;
        if (photo) {
          photo.uploaded = true;
          photo.uploadedAt = new Date().toISOString();
          const updateRequest = store.put(photo);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Photo not found, consider it handled
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removePhoto(photoId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingPhotos'], 'readwrite');
    const store = transaction.objectStore('pendingPhotos');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(photoId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Catch submission storage methods
  async savePendingCatch(formData: MultipleCatchFormData, imei: string | null, username: string | null = null): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingCatches'], 'readwrite');
    const store = transaction.objectStore('pendingCatches');
    
    const catchData = {
      formData,
      imei: imei || null,
      username: username || null,
      timestamp: new Date().toISOString(),
      submitted: false,
      retryCount: 0,
      lastError: null
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(catchData);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCatches(): Promise<CatchRecord[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['pendingCatches'], 'readonly');
    const store = transaction.objectStore('pendingCatches');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.filter(catchData => !catchData.submitted));
      request.onerror = () => reject(request.error);
    });
  }

  async markCatchSubmitted(catchId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingCatches'], 'readwrite');
    const store = transaction.objectStore('pendingCatches');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(catchId);
      getRequest.onsuccess = () => {
        const catchData = getRequest.result;
        if (catchData) {
          catchData.submitted = true;
          catchData.submittedAt = new Date().toISOString();
          const updateRequest = store.put(catchData);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Waypoint submission storage methods
  async savePendingWaypoint(
    userId: string,
    formData: WaypointFormData,
    imei?: string,
    username?: string
  ): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingWaypoints'], 'readwrite');
    const store = transaction.objectStore('pendingWaypoints');

    const waypointData: WaypointRecord = {
      userId,
      imei,
      username,
      formData,
      timestamp: new Date().toISOString(),
      submitted: false,
      retryCount: 0,
      lastError: null
    };

    return new Promise((resolve, reject) => {
      const request = store.add(waypointData);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingWaypoints(): Promise<WaypointRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingWaypoints'], 'readonly');
    const store = transaction.objectStore('pendingWaypoints');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.filter(wp => !wp.submitted));
      request.onerror = () => reject(request.error);
    });
  }

  async markWaypointSubmitted(waypointId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['pendingWaypoints'], 'readwrite');
    const store = transaction.objectStore('pendingWaypoints');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(waypointId);
      getRequest.onsuccess = () => {
        const waypointData = getRequest.result;
        if (waypointData) {
          waypointData.submitted = true;
          waypointData.submittedAt = new Date().toISOString();
          const updateRequest = store.put(waypointData);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Trip data caching methods (for offline viewing)
  async cacheTripData(imei: string, tripPoints: TripPoint[], dateFrom: Date, dateTo: Date): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['tripDataCache'], 'readwrite');
    const store = transaction.objectStore('tripDataCache');
    const index = store.index('imei');

    // Find and delete existing cache for this IMEI
    const existingRequest = index.getAll(imei);

    return new Promise((resolve, reject) => {
      existingRequest.onsuccess = () => {
        const existing = existingRequest.result;

        // Delete old cache entries for this IMEI
        existing.forEach(record => {
          if (record.id) store.delete(record.id);
        });

        // Add new cache
        const cacheData: TripDataCache = {
          imei,
          tripPoints,
          cachedAt: new Date().toISOString(),
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString()
        };

        const addRequest = store.add(cacheData);
        addRequest.onsuccess = () => {
          console.log(`✅ Cached ${tripPoints.length} trip points for IMEI ${imei}`);
          resolve();
        };
        addRequest.onerror = () => reject(addRequest.error);
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    });
  }

  async getCachedTripData(imei: string): Promise<TripDataCache | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['tripDataCache'], 'readonly');
    const store = transaction.objectStore('tripDataCache');
    const index = store.index('imei');

    return new Promise((resolve, reject) => {
      const request = index.get(imei);
      request.onsuccess = () => {
        const result = request.result as TripDataCache | undefined;
        if (result) {
          console.log(`📦 Retrieved cached trip data for IMEI ${imei} (cached ${new Date(result.cachedAt).toLocaleString()})`);
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Live location caching methods (last known positions)
  async cacheLiveLocation(imei: string, location: LiveLocation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['liveLocationCache'], 'readwrite');
    const store = transaction.objectStore('liveLocationCache');
    const index = store.index('imei');

    // Find existing location for this IMEI
    const existingRequest = index.get(imei);

    return new Promise((resolve, reject) => {
      existingRequest.onsuccess = () => {
        const existing = existingRequest.result;

        const cacheData: LiveLocationCache = {
          imei,
          location,
          cachedAt: new Date().toISOString()
        };

        if (existing && existing.id) {
          // Update existing
          cacheData.id = existing.id;
          const updateRequest = store.put(cacheData);
          updateRequest.onsuccess = () => {
            console.log(`✅ Updated cached live location for IMEI ${imei}`);
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // Add new
          const addRequest = store.add(cacheData);
          addRequest.onsuccess = () => {
            console.log(`✅ Cached new live location for IMEI ${imei}`);
            resolve();
          };
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    });
  }

  async getCachedLiveLocation(imei: string): Promise<LiveLocationCache | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['liveLocationCache'], 'readonly');
    const store = transaction.objectStore('liveLocationCache');
    const index = store.index('imei');

    return new Promise((resolve, reject) => {
      const request = index.get(imei);
      request.onsuccess = () => {
        const result = request.result as LiveLocationCache | undefined;
        if (result) {
          const cacheAge = Date.now() - new Date(result.cachedAt).getTime();
          const hoursAgo = Math.floor(cacheAge / (1000 * 60 * 60));
          console.log(`📦 Retrieved cached live location for IMEI ${imei} (${hoursAgo}h old)`);
        }
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Upload queue methods
  async addToUploadQueue(type: 'photo' | 'catch' | 'waypoint', itemId: number, priority: number = 1): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
    const store = transaction.objectStore('uploadQueue');
    
    const queueItem = {
      type,
      itemId,
      priority,
      status: 'pending',
      retryCount: 0,
      nextRetryAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUploadQueue(): Promise<UploadQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['uploadQueue'], 'readonly');
    const store = transaction.objectStore('uploadQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        // Sort by priority (higher first) and creation time
        const results = request.result
          .filter(item => item.status === 'pending')
          .sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateQueueItemStatus(queueId: number, status: 'pending' | 'uploading' | 'completed' | 'failed', error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
    const store = transaction.objectStore('uploadQueue');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(queueId);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = status;
          if (error) item.lastError = error;
          if (status === 'failed') {
            item.retryCount = (item.retryCount || 0) + 1;
            // Exponential backoff: 2^retryCount minutes
            const delayMinutes = Math.pow(2, item.retryCount);
            item.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
          }
          item.updatedAt = new Date().toISOString();
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async removeFromQueue(queueId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['uploadQueue'], 'readwrite');
    const store = transaction.objectStore('uploadQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(queueId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Network status and stats
  async getStorageStats(): Promise<{
    pendingPhotos: number;
    pendingCatches: number;
    pendingWaypoints: number;
    queuedUploads: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const [photos, catches, waypoints, queue] = await Promise.all([
      this.getAllFromStore('pendingPhotos'),
      this.getAllFromStore('pendingCatches'),
      this.getAllFromStore('pendingWaypoints'),
      this.getUploadQueue()
    ]);

    return {
      pendingPhotos: (photos as PhotoRecord[]).filter(p => !(p as any).uploaded).length,
      pendingCatches: (catches as CatchRecord[]).filter(c => !c.submitted).length,
      pendingWaypoints: (waypoints as WaypointRecord[]).filter(w => !w.submitted).length,
      queuedUploads: queue.length
    };
  }

  private async getAllFromStore(storeName: string): Promise<PhotoRecord[] | CatchRecord[] | WaypointRecord[] | UploadQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Global instance
export const offlineStorage = new OfflineStorage();