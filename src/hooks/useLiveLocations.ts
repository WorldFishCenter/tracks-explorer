import { useState, useEffect } from 'react';
import { LiveLocation } from '../types';
import { fetchLiveLocations } from '../api/pelagicDataService';
import { useAuth } from '../contexts/AuthContext';

interface UseLiveLocationsReturn {
  liveLocations: LiveLocation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useLiveLocations = (): UseLiveLocationsReturn => {
  const { currentUser } = useAuth();
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveLocationsData = async () => {
    console.log('loadLiveLocations effect triggered');
    
    if (!currentUser) {
      console.log('No current user, skipping live locations load');
      setLiveLocations([]);
      return;
    }
    
    if (!currentUser.imeis || currentUser.imeis.length === 0) {
      console.log('User has no IMEIs, skipping live locations load');
      setLiveLocations([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading live locations for user:', currentUser.name, 'IMEIs:', currentUser.imeis);
      const locations = await fetchLiveLocations(currentUser.imeis);
      console.log('Live locations loaded successfully:', locations);
      setLiveLocations(locations || []);
    } catch (err) {
      console.error('Error loading live locations:', err);
      setError('Failed to load live location data');
      setLiveLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveLocationsData();
  }, [currentUser]);

  return {
    liveLocations,
    loading,
    error,
    refetch: fetchLiveLocationsData
  };
}; 