import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import DateRangeSelector from '../components/DateRangeSelector';
import TripsTable from '../components/TripsTable';
import { IconCalendarStats, IconFish } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
    <div className="page-header py-0 border-bottom-0">
      <div className="container-xl">
        <div className="page-pretitle text-secondary fs-sm">
          {t('dashboard.dateRange', {
            from: formatDisplayDate(dateFrom),
            to: formatDisplayDate(dateTo),
            days: differenceInDays(dateTo, dateFrom) + 1
          })}
        </div>
        <h2 className="page-title mb-0 mt-0">{t('dashboard.title')}</h2>
      </div>
    </div>
  );

  console.log('Dashboard render - about to return JSX', {
    currentUser,
    liveLocations: liveLocations.length,
  });

  return (
    <MainLayout pageHeader={pageHeader}>
      <div className="row g-2 mt-0">
        {/* Sidebar */}
        <div className="col-lg-3 col-md-4">
          {/* Date Range Selector */}
          <div className="card mb-2">
            <div className="card-body p-2">
              <div className="d-flex align-items-center mb-2">
                <IconCalendarStats className="icon me-2 text-primary" />
                <h3 className="card-title m-0">{t('common.dateRange')}</h3>
              </div>
              
              <DateRangeSelector 
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
              />
            </div>
          </div>
          
          {/* Report Catch Button */}
          <div className="card mb-2">
            <div className="card-body p-2">
              <button
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center position-relative"
                onClick={handleReportCatchClick}
                style={{ minHeight: '45px' }}
              >
                <IconFish className="me-2" size={20} />
                <span className="fw-bold">{t('catch.reportCatch')}</span>
                <span className="badge bg-yellow text-dark position-absolute top-0 rounded-pill" style={{ fontSize: '0.65rem', right: '-1px', transform: 'translateY(-50%)' }}>
                  NEW
                </span>
              </button>
              <small className="text-muted mt-2 d-block text-center">
                {t('catch.reportFromRecentTrips')}
              </small>
            </div>
          </div>
          
          {/* Vessel Details Panel */}
          <VesselDetailsPanel 
            liveLocations={liveLocations}
            onCenterOnLiveLocations={centerOnLiveLocations}
          />
          
          {/* Vessel Insights */}
          <VesselInsightsPanel insights={insights} tripsCount={trips.length} />
        </div>
        
        {/* Map Area */}
        <div className="col-lg-9 col-md-8">
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
          <div className="mt-2">
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