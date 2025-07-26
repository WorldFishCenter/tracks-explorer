import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import FishersMap from '../components/Map';
import DateRangeSelector from '../components/DateRangeSelector';
import TripsTable from '../components/TripsTable';
import { IconFileAnalytics, IconInfoCircle, IconLogout, IconAlertTriangle, IconCalendarStats, IconAnchor, IconRoute, IconClock, IconChartLine, IconRefresh, IconSailboat, IconMapPins } from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchTrips, Trip, fetchTripPoints, TripPoint, fetchLiveLocations, LiveLocation } from '../api/pelagicDataService';
import { subDays, format, differenceInDays } from 'date-fns';

// Example data for the vessel details panel
interface VesselDetails {
  id: string;
  name: string;
  captain?: string;
  registration?: string;
  lastUpdate: string;
  status: 'active' | 'docked' | 'unknown';
  fishing?: boolean;
  speed: number;
  distanceKm?: number;
  durationMinutes?: number;
  // Enhanced vessel information
  imei?: string;
  batteryState?: string;
  community?: string;
  region?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  lastGpsTime?: string;
  lastSeenTime?: string;
  externalBoatId?: string;
}

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedVessel, setSelectedVessel] = useState<VesselDetails | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(undefined);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripPoints, setTripPoints] = useState<TripPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataAvailable, setDataAvailable] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveLocations, setLiveLocations] = useState<LiveLocation[]>([]);
  const [centerMapOnLiveLocations, setCenterMapOnLiveLocations] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard State Debug:', {
      currentUser: currentUser ? { name: currentUser.name, imeis: currentUser.imeis } : null,
      liveLocationsCount: liveLocations.length,
      liveLocations
    });
  }, [currentUser, liveLocations]);
  
  // Check if data is available for the user's IMEIs
  useEffect(() => {
    if (currentUser) {
      checkDataAvailability();
    }
  }, [currentUser, dateFrom, dateTo]);
  
  // Fetch live locations for the current user
  useEffect(() => {
    const loadLiveLocations = async () => {
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
      
      console.log('Loading live locations for user:', currentUser.name, 'IMEIs:', currentUser.imeis);
      try {
        const locations = await fetchLiveLocations(currentUser.imeis);
        console.log('Live locations loaded successfully:', locations);
        setLiveLocations(locations || []);
      } catch (err) {
        console.error('Error loading live locations:', err);
        setLiveLocations([]);
      }
    };
    
    loadLiveLocations();
  }, [currentUser]); // Only depend on currentUser
  
  // Extract this function outside of useEffect for reuse
  const checkDataAvailability = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Always use the user's IMEIs, regardless of role
      const imeis = currentUser.imeis;
      
      console.log('Current user:', currentUser.name);
      console.log('User IMEIs:', currentUser.imeis);
      console.log('Date range:', dateFrom, dateTo);
      
      // Fetch both trip points and trips at the same time
      const [points, tripData] = await Promise.all([
        fetchTripPoints({
          dateFrom,
          dateTo,
          imeis,
          includeDeviceInfo: true,
          includeLastSeen: true
        }),
        fetchTrips({
          dateFrom,
          dateTo,
          imeis,
          includeDeviceInfo: true,
          includeLastSeen: true
        })
      ]);
      
      setTripPoints(points);
      setTrips(tripData);
      setDataAvailable(points.length > 0 || tripData.length > 0);
      
      console.log(`Loaded ${points.length} trip points and ${tripData.length} trips`);
      
      if (points.length > 0) {
        console.log("Sample point:", points[0]);
      }
      
      if (tripData.length > 0) {
        console.log("Sample trip:", tripData[0]);
      }
    } catch (err) {
      console.error('Error checking data availability:', err);
      setDataAvailable(false);
      setErrorMessage('Failed to retrieve vessel data. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVessel = async (vessel: { id: string; name: string } | null) => {
    if (!vessel) {
      // Clear selection if null is passed (e.g., from "Show All Trips" button)
      setSelectedVessel(null);
      setSelectedTripId(undefined);
      return;
    }
    
    setLoading(true);
    
    try {
      // Find the selected trip in our already loaded trips
      const selectedTrip = trips.find(trip => trip.id === vessel.id);
      
      if (selectedTrip) {
        // Set selected trip ID for map filtering
        setSelectedTripId(selectedTrip.id);
        
        // Calculate average speed from trip points for this trip
        const tripPointsForTrip = tripPoints.filter(point => point.tripId === selectedTrip.id);
        const validSpeedPoints = tripPointsForTrip.filter(point => point.speed != null && point.speed > 0);
        const avgSpeed = validSpeedPoints.length > 0
          ? validSpeedPoints.reduce((sum, point) => sum + (point.speed || 0), 0) / validSpeedPoints.length
          : 0;
        
        // Find corresponding live location data for this vessel
        const liveLocation = liveLocations.find(loc => loc.imei === selectedTrip.imei);
        
        // Get the latest point for coordinates
        const latestPoint = tripPointsForTrip.length > 0 
          ? tripPointsForTrip.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0]
          : null;
        
        setSelectedVessel({
          id: selectedTrip.id,
          name: vessel.name || selectedTrip.boatName || `Trip ${selectedTrip.id}`,
          lastUpdate: selectedTrip.lastSeen || selectedTrip.endTime,
          status: new Date(selectedTrip.lastSeen || selectedTrip.endTime) > subDays(new Date(), 1) 
            ? 'active' 
            : 'docked',
          speed: avgSpeed, // Use calculated average speed from points
          distanceKm: selectedTrip.distanceMeters ? selectedTrip.distanceMeters / 1000 : undefined,
          durationMinutes: selectedTrip.durationSeconds ? Math.round(selectedTrip.durationSeconds / 60) : undefined,
          // Enhanced vessel information
          imei: selectedTrip.imei,
          batteryState: liveLocation?.batteryState,
          community: selectedTrip.community || liveLocation?.directCustomerName,
          coordinates: liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : 
                      latestPoint ? { lat: latestPoint.latitude, lng: latestPoint.longitude } : undefined,
          lastGpsTime: liveLocation?.lastGpsTs ? new Date(liveLocation.lastGpsTs).toLocaleString() : undefined,
          lastSeenTime: liveLocation?.lastSeen ? new Date(liveLocation.lastSeen).toLocaleString() : undefined,
          externalBoatId: liveLocation?.externalBoatId
        });
      } else {
        console.error('Selected trip not found in loaded trips');
      }
    } catch (err) {
      console.error('Error selecting vessel:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle trip selection from the table
  const handleSelectTrip = (tripId: string) => {
    const selectedTrip = trips.find(trip => trip.id === tripId);
    if (selectedTrip) {
      handleSelectVessel({
        id: selectedTrip.id,
        name: selectedTrip.boatName || `Trip ${selectedTrip.id}`
      });
    }
  };

  const handleDateChange = (newDateFrom: Date, newDateTo: Date) => {
    setDateFrom(newDateFrom);
    setDateTo(newDateTo);
    // Reset selection when date range changes
    setSelectedVessel(null);
    setSelectedTripId(undefined);
  };

  // Handle preset date range selections
  const handlePresetDateRange = (days: number) => {
    const newDateTo = new Date();
    const newDateFrom = subDays(newDateTo, days);
    handleDateChange(newDateFrom, newDateTo);
  };

  // Render "No data" message for the specified IMEI
  const renderNoImeiDataMessage = () => {
    if (!currentUser) return "No vessel data is available.";
    
    if (currentUser.role === 'admin') {
      return "No tracking data is available for the selected date range.";
    }
    
    const imeis = currentUser.imeis || [];
    const imeiCount = imeis.length;
    
    if (imeiCount === 0) {
      return "No vessel IMEIs are associated with your account.";
    } else if (imeiCount === 1) {
      return `No tracking data is available for your IMEI: ${imeis[0]}`;
    } else {
      return `No tracking data is available for your IMEIs: ${imeis.join(', ')}`;
    }
  };

  // Render user IMEI info 
  const renderUserImeiInfo = () => {
    if (!currentUser || currentUser.role === 'admin') return null;
    
    const imeis = currentUser.imeis || [];
    
    if (imeis.length === 0) {
      return "No IMEIs associated with your account";
    } else if (imeis.length === 1) {
      return <>Your IMEI: {imeis[0]}</>;
    } else {
      return <>Your IMEIs: {imeis.join(', ')}</>;
    }
  };

  // Calculate trip statistics for vessel insights
  const calculateVesselInsights = () => {
    if (!tripPoints || tripPoints.length === 0) {
      return { activeTrips: 0, totalDistance: 0, avgSpeed: 0 };
    }

    // Group points by trip ID
    const tripGroups: Record<string, TripPoint[]> = {};
    
    tripPoints.forEach(point => {
      if (!tripGroups[point.tripId]) {
        tripGroups[point.tripId] = [];
      }
      tripGroups[point.tripId].push(point);
    });

    // Count active trips (had points in the last 24 hours)
    const oneDayAgo = subDays(new Date(), 1).getTime();
    const activeTrips = Object.values(tripGroups).filter(points => {
      const latestPoint = points.sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      )[0];
      return latestPoint && new Date(latestPoint.time).getTime() > oneDayAgo;
    }).length;

    // Calculate total distance (in km)
    const totalDistance = Object.values(tripGroups).reduce((sum, points) => {
      // Use the max range value as an approximation of trip distance
      const maxRange = Math.max(...points.map(p => p.range || 0));
      return sum + (maxRange / 1000); // Convert from meters to km
    }, 0);

    // Calculate average speed across all points
    const allSpeeds = tripPoints.map(p => p.speed || 0);
    const avgSpeed = allSpeeds.length > 0 
      ? allSpeeds.reduce((sum, speed) => sum + speed, 0) / allSpeeds.length 
      : 0;

    return {
      activeTrips,
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      avgSpeed: parseFloat(avgSpeed.toFixed(1))
    };
  };

  const insights = calculateVesselInsights();

  // Helper function to format date for display
  const formatDisplayDate = (date: Date): string => {
    return format(date, 'MMM d, yyyy');
  };

  // Function to center map on live locations
  const centerOnLiveLocations = () => {
    console.log('centerOnLiveLocations called, liveLocations:', liveLocations);
    if (liveLocations.length > 0) {
      console.log('Centering map on live locations');
      setCenterMapOnLiveLocations(true);
      // Reset the flag after a short delay
      setTimeout(() => setCenterMapOnLiveLocations(false), 100);
    } else {
      console.log('No live locations to center on');
    }
  };

  // Helper function to get battery badge class
  const getBatteryBadgeClass = (batteryState: string) => {
    if (batteryState.includes('Low')) return 'bg-warning text-dark';
    if (batteryState.includes('Critical')) return 'bg-danger text-white';
    return 'bg-success text-white';
  };

  // Create the page header
  const pageHeader = (
    <div className="page-header py-0 border-bottom-0">
      <div className="container-xl">
        <div className="page-pretitle text-secondary fs-sm">
          {formatDisplayDate(dateFrom)} - {formatDisplayDate(dateTo)} · {differenceInDays(dateTo, dateFrom) + 1} days
        </div>
        <h2 className="page-title mb-0 mt-0">Vessel Tracking</h2>
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
        <div className="col-md-3">
          {/* Date Range Selector */}
          <div className="card mb-2">
            <div className="card-body p-2">
              <div className="d-flex align-items-center mb-2">
                <IconCalendarStats className="icon me-2 text-primary" />
                <h3 className="card-title m-0">Date Range</h3>
              </div>
              
              <DateRangeSelector 
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
              />
            </div>
          </div>
          
          {/* Live Location Button */}
          <div className="card mb-2">
            <div className="card-body p-2">
              <div className="d-flex align-items-center mb-2">
                <IconSailboat className="icon me-2 text-primary" />
                <h3 className="card-title m-0">Live Locations</h3>
              </div>
              <button
                className="btn btn-danger w-100"
                onClick={centerOnLiveLocations}
              >
                <IconSailboat className="icon me-2" />
                Last Location ({liveLocations.length})
              </button>
              <div className="text-muted small mt-1">
                {liveLocations.length > 0 
                  ? `Click to center map on ${liveLocations.length} live vessel location${liveLocations.length > 1 ? 's' : ''}`
                  : 'No live locations available'
                }
              </div>
            </div>
          </div>
          
          {/* Vessel Details Panel */}
          <div className="card mb-2" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center mb-3">
                <IconAnchor className="icon me-2 text-primary" />
                <h3 className="card-title m-0">Vessel Details</h3>
              </div>
              
              {selectedVessel ? (
                <div>
                  {/* Vessel Header */}
                  <div className="d-flex align-items-center mb-3 p-2 bg-light rounded">
                    <div style={{ width: 40, height: 40, background: '#ffa726', borderRadius: 6, marginRight: 12 }} />
                    <div>
                      <h4 className="m-0 mb-1">{selectedVessel.name}</h4>
                      {selectedVessel.imei && (
                        <div className="text-muted small font-monospace">{selectedVessel.imei}</div>
                      )}
                    </div>
                  </div>

                  {/* Battery Status */}
                  {selectedVessel.batteryState && (
                    <div className="card mb-3 border-0 bg-light">
                      <div className="card-body p-2">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-battery-half me-2 text-primary" style={{ fontSize: '1.2em' }} />
                          <div>
                            <div className="fw-bold">Battery Status</div>
                            <span className={`badge ${getBatteryBadgeClass(selectedVessel.batteryState)}`}>
                              {selectedVessel.batteryState}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trip Summary */}
                  <div className="card mb-3 border-0 bg-light">
                    <div className="card-body p-2">
                      <div className="d-flex align-items-center mb-2">
                        <IconRoute size={18} className="me-2 text-primary" />
                        <h6 className="m-0">Trip Summary</h6>
                      </div>
                      <div className="row g-2">
                        {selectedVessel.speed !== undefined && (
                          <div className="col-6">
                            <div className="text-muted small">Speed (last point)</div>
                            <div className="fw-bold">{selectedVessel.speed.toFixed(1)} km/h</div>
                          </div>
                        )}
                        {selectedVessel.distanceKm && (
                          <div className="col-6">
                            <div className="text-muted small">Distance (trip)</div>
                            <div className="fw-bold">{selectedVessel.distanceKm.toFixed(1)} km</div>
                          </div>
                        )}
                        {selectedVessel.durationMinutes && (
                          <div className="col-6">
                            <div className="text-muted small">Duration (trip)</div>
                            <div className="fw-bold">
                              {Math.floor(selectedVessel.durationMinutes / 60)}h {selectedVessel.durationMinutes % 60}m
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last Known Location */}
                  <div className="card mb-3 border-0 bg-light">
                    <div className="card-body p-2">
                      <div className="d-flex align-items-center mb-2">
                        <IconMapPins size={18} className="me-2 text-primary" />
                        <h6 className="m-0">Last Known Location</h6>
                      </div>
                      <div className="row g-2">
                        {selectedVessel.coordinates && (
                          <div className="col-12 mb-2">
                            <div className="text-muted small">Coordinates</div>
                            <div className="fw-bold font-monospace">
                              {selectedVessel.coordinates.lat.toFixed(4)}, {selectedVessel.coordinates.lng.toFixed(4)}
                            </div>
                          </div>
                        )}
                        {selectedVessel.lastGpsTime && (
                          <div className="col-6">
                            <div className="text-muted small">Last GPS</div>
                            <div className="fw-bold small">{selectedVessel.lastGpsTime}</div>
                          </div>
                        )}
                        {selectedVessel.lastSeenTime && (
                          <div className="col-6">
                            <div className="text-muted small">Last Seen</div>
                            <div className="fw-bold small">{selectedVessel.lastSeenTime}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last Update */}
                  <div className="text-center p-2 bg-light rounded">
                    <div className="text-muted small">Last Update</div>
                    <div className="fw-bold">{new Date(selectedVessel.lastUpdate).toLocaleString()}</div>
                  </div>

                  <div className="mt-3 text-center">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-download me-1" /> Export Data
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <IconInfoCircle size={32} className="mb-2 text-muted" />
                  <div>Select a vessel to see details</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Vessel Insights */}
          <div className="card">
            <div className="card-body p-2">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <IconChartLine className="icon me-2 text-primary" />
                  <h3 className="card-title m-0">Vessel Insights</h3>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="card card-sm">
                  <div className="card-body py-1">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="bg-primary text-white avatar avatar-sm">
                          <IconRoute size={18} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          Trips
                        </div>
                        <div className="text-muted">
                          {trips.length} total ({insights.activeTrips} active)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card card-sm">
                  <div className="card-body py-1">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="bg-green text-white avatar avatar-sm">
                          <IconClock size={18} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          Average Speed
                        </div>
                        <div className="text-muted">
                          {insights.avgSpeed} km/h
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card card-sm">
                  <div className="card-body py-1">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="bg-azure text-white avatar avatar-sm">
                          <IconRoute size={18} />
                        </span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          Total Distance
                        </div>
                        <div className="text-muted">
                          {insights.totalDistance} km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Map Area */}
        <div className="col-md-9">
          <div className="card mb-2" style={{ height: "500px" }}>
            <div className="card-body p-0">
              {loading && (
                <div className="empty" style={{ height: "100%" }}>
                  <div className="empty-icon">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <p className="empty-title">Loading vessel data...</p>
                  <p className="empty-subtitle text-muted">
                    Please wait while we retrieve your vessel information
                  </p>
                </div>
              )}
              
              {errorMessage && !loading && (
                <div className="empty" style={{ height: "100%" }}>
                  <div className="empty-icon">
                    <IconAlertTriangle size={48} className="text-danger" />
                  </div>
                  <p className="empty-title">Error loading data</p>
                  <p className="empty-subtitle text-muted">
                    {errorMessage}
                  </p>
                  <div className="empty-action">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => checkDataAvailability()}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              
              {dataAvailable === false && !loading && !errorMessage && (
                <div className="empty" style={{ height: "100%" }}>
                  <div className="empty-icon">
                    <IconAlertTriangle size={48} className="text-warning" />
                  </div>
                  <p className="empty-title">No vessel data found</p>
                  <p className="empty-subtitle text-muted">
                    {renderNoImeiDataMessage()}
                  </p>
                  <div className="empty-action">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleDateChange(subDays(new Date(), 90), new Date())}
                    >
                      Try a wider date range
                    </button>
                  </div>
                </div>
              )}
              
              {!loading && !errorMessage && dataAvailable && (
                <FishersMap 
                  onSelectVessel={handleSelectVessel} 
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  selectedTripId={selectedTripId}
                  liveLocations={liveLocations}
                  centerOnLiveLocations={centerMapOnLiveLocations}
                />
              )}
            </div>
          </div>
          
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
    </MainLayout>
  );
};

export default Dashboard; 