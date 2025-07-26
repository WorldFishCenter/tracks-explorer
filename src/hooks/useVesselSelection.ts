import { useState } from 'react';
import { Trip, TripPoint, LiveLocation, VesselDetails } from '../types';
import { convertTripToVesselDetails } from '../utils/calculations';

interface UseVesselSelectionReturn {
  selectedVessel: VesselDetails | null;
  selectedTripId: string | undefined;
  handleSelectVessel: (vessel: { id: string; name: string } | null) => void;
  handleSelectTrip: (tripId: string) => void;
  clearSelection: () => void;
}

export const useVesselSelection = (
  trips: Trip[],
  tripPoints: TripPoint[],
  liveLocations: LiveLocation[]
): UseVesselSelectionReturn => {
  const [selectedVessel, setSelectedVessel] = useState<VesselDetails | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(undefined);

  const handleSelectVessel = (vessel: { id: string; name: string } | null) => {
    if (!vessel) {
      setSelectedVessel(null);
      setSelectedTripId(undefined);
      return;
    }
    
    // Find the selected trip in our already loaded trips
    const selectedTrip = trips.find(trip => trip.id === vessel.id);
    
    if (selectedTrip) {
      // Set selected trip ID for map filtering
      setSelectedTripId(selectedTrip.id);
      
      // Find corresponding live location data for this vessel
      const liveLocation = liveLocations.find(loc => loc.imei === selectedTrip.imei);
      
      // Convert trip to vessel details
      const vesselDetails = convertTripToVesselDetails(selectedTrip, tripPoints, liveLocation);
      
      setSelectedVessel({
        ...vesselDetails,
        name: vessel.name || vesselDetails.name
      });
    } else {
      console.error('Selected trip not found in loaded trips');
    }
  };

  const handleSelectTrip = (tripId: string) => {
    const selectedTrip = trips.find(trip => trip.id === tripId);
    if (selectedTrip) {
      handleSelectVessel({
        id: selectedTrip.id,
        name: selectedTrip.boatName || `Trip ${selectedTrip.id}`
      });
    }
  };

  const clearSelection = () => {
    setSelectedVessel(null);
    setSelectedTripId(undefined);
  };

  return {
    selectedVessel,
    selectedTripId,
    handleSelectVessel,
    handleSelectTrip,
    clearSelection
  };
}; 