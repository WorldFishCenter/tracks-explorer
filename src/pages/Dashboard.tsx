import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import DateRangeSelector from '../components/DateRangeSelector';
import TripsTable from '../components/TripsTable';
import { CalendarDays, Fish } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, format, differenceInDays } from 'date-fns';
import { Trip, TripPoint, LiveLocation } from '../types';
import { calculateVesselInsights } from '../utils/calculations';
import { formatDisplayDate } from '../utils/formatters';
import { renderNoImeiDataMessage } from '../utils/userInfo';
import { useTripData } from '../hooks/useTripData';
import { useLiveLocations } from '../hooks/useLiveLocations';
import { useVesselSelection } from '../hooks/useVesselSelection';
import VesselDetailsPanel from '../components/dashboard/VesselDetailsPanel';
import VesselInsightsPanel from '../components/dashboard/VesselInsightsPanel';

import MapContainer from '../components/dashboard/MapContainer';
import TripSelectionModal from '../components/TripSelectionModal';
import ReportCatchForm from '../components/ReportCatchForm';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [centerMapOnLiveLocations, setCenterMapOnLiveLocations] = useState(false);
  const [isViewingLiveLocations, setIsViewingLiveLocations] = useState(false);
  
  // Catch reporting state
  const [showTripSelection, setShowTripSelection] = useState(false);
  const [selectedTripForCatch, setSelectedTripForCatch] = useState<Trip | null>(null);

  // Custom hooks for data management
  const {
    trips,
    tripPoints,
    loading,
    dataAvailable,
    errorMessage,
    refetch: refetchTripData
  } = useTripData(dateFrom, dateTo);

  const {
    liveLocations,
    loading: liveLocationsLoading,
    error: liveLocationsError,
    refetch: refetchLiveLocations
  } = useLiveLocations();

  const {
    selectedVessel,
    selectedTripId,
    handleSelectVessel: originalHandleSelectVessel,
    handleSelectTrip: originalHandleSelectTrip,
    clearSelection
  } = useVesselSelection(trips, tripPoints, liveLocations);

  // Wrapper for handleSelectVessel that also resets live location view
  const handleSelectVessel = (vessel: any) => {
    originalHandleSelectVessel(vessel);
    setIsViewingLiveLocations(false);
  };

  // Wrapper for handleSelectTrip that also resets live location view
  const handleSelectTrip = (tripId: string) => {
    originalHandleSelectTrip(tripId);
    setIsViewingLiveLocations(false);
  };

  // Debug logging
  useEffect(() => {
    console.log('Dashboard State Debug:', {
      currentUser: currentUser ? { name: currentUser.name, imeis: currentUser.imeis } : null,
      liveLocationsCount: liveLocations.length,
      liveLocations
    });
  }, [currentUser, liveLocations]);

  const handleDateChange = (newDateFrom: Date, newDateTo: Date) => {
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
    // Reset selection when date range changes
    clearSelection();
    // Reset live location view when user changes date range
    setIsViewingLiveLocations(false);
  };

  // Handle preset date range selections
  const handlePresetDateRange = (days: number) => {
    const newDateTo = new Date();
    const newDateFrom = subDays(newDateTo, days);
    handleDateChange(newDateFrom, newDateTo);
  };

  // Function to center map on live locations
  const centerOnLiveLocations = () => {
    console.log('centerOnLiveLocations called, liveLocations:', liveLocations);
    if (liveLocations.length > 0) {
      console.log('Centering map on live locations');
      setCenterMapOnLiveLocations(true);
      setIsViewingLiveLocations(true);
      // Reset the flag after a short delay
      setTimeout(() => setCenterMapOnLiveLocations(false), 100);
    } else {
      console.log('No live locations to center on');
    }
  };

  // Catch reporting handlers
  const handleReportCatchClick = () => {
    setShowTripSelection(true);
  };

  const handleTripSelectionClose = () => {
    setShowTripSelection(false);
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTripForCatch(trip);
    setShowTripSelection(false);
  };

  const handleCatchFormClose = () => {
    setSelectedTripForCatch(null);
  };

  const handleCatchFormSuccess = () => {
    setSelectedTripForCatch(null);
  };

  // Calculate trip statistics for vessel insights
  const insights = calculateVesselInsights(tripPoints);

  // Create the page header
  const pageHeader = (
    <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 py-4">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-sm text-muted-foreground">
          {t('dashboard.dateRange', {
            from: formatDisplayDate(dateFrom),
            to: formatDisplayDate(dateTo),
            days: differenceInDays(dateTo, dateFrom) + 1
          })}
        </div>
        <h2 className="text-lg font-medium">{t('dashboard.title')}</h2>
      </div>
    </div>
  );

  console.log('Dashboard render - about to return JSX', {
    currentUser,
    liveLocations: liveLocations.length,
  });

  return (
    <MainLayout pageHeader={pageHeader}>
      <div className="container mx-auto px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date Range Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span>{t('common.dateRange')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DateRangeSelector 
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateChange={handleDateChange}
                />
              </CardContent>
            </Card>
            
            {/* Report Catch Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full h-12"
                  onClick={handleReportCatchClick}
                >
                  <Fish className="mr-2 h-5 w-5" />
                  <span className="font-semibold">{t('catch.reportCatch')}</span>
                </Button>
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {t('catch.reportFromRecentTrips')}
                </p>
              </CardContent>
            </Card>
            
            {/* Vessel Details Panel */}
            <VesselDetailsPanel 
              liveLocations={liveLocations}
              onCenterOnLiveLocations={centerOnLiveLocations}
            />
            
            {/* Vessel Insights */}
            <VesselInsightsPanel insights={insights} tripsCount={trips.length} />
          </div>
          
          {/* Map Area */}
          <div className="lg:col-span-2 space-y-6">
            <MapContainer
              loading={loading}
              errorMessage={errorMessage}
              dataAvailable={dataAvailable}
              dateFrom={dateFrom}
              dateTo={dateTo}
              selectedTripId={selectedTripId}
              liveLocations={liveLocations}
              centerOnLiveLocations={centerMapOnLiveLocations}
              onSelectVessel={handleSelectVessel}
              onRetry={refetchTripData}
              onTryWiderDateRange={() => handleDateChange(subDays(new Date(), 90), new Date())}
              renderNoImeiDataMessage={() => renderNoImeiDataMessage(currentUser)}
              isViewingLiveLocations={isViewingLiveLocations}
            />
            
            {/* Trips Table - Below the map */}
            <TripsTable 
              trips={trips} 
              onSelectTrip={handleSelectTrip} 
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Trip Selection Modal */}
      {showTripSelection && (
        <TripSelectionModal
          onSelectTrip={handleTripSelect}
          onClose={handleTripSelectionClose}
        />
      )}

      {/* Report Catch Form Modal */}
      {selectedTripForCatch && (
        <ReportCatchForm
          trip={selectedTripForCatch}
          onClose={handleCatchFormClose}
          onSuccess={handleCatchFormSuccess}
        />
      )}
    </MainLayout>
  );
};

export default Dashboard; 