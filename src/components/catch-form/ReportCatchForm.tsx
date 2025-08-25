import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFish, IconCheck, IconAlertTriangle, IconCalendar, IconPlus, IconBan } from '@tabler/icons-react';
import { Trip, FishGroup, MultipleCatchFormData, CatchEntry, GPSCoordinate } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { submitMultipleCatchEvents } from '../../api/catchEventsService';
import { formatTripDate } from '../../utils/formatters';
import { usePhotoHandling } from './hooks/usePhotoHandling';
import DateSelector from './DateSelector';
import CatchEntryForm from './CatchEntryForm';
import CatchSummary from './CatchSummary';

interface ReportCatchFormProps {
  trip: Trip;
  onClose: () => void;
  onSuccess: () => void;
}

const ReportCatchForm: React.FC<ReportCatchFormProps> = ({ trip, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection and body scroll lock effect
  useEffect(() => {
    const detectTheme = () => {
      const theme = document.documentElement.getAttribute('data-bs-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    detectTheme();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
          detectTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme']
    });

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      observer.disconnect();
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Check if this is a direct catch report (standalone trip)
  const isDirectCatch = trip.id.startsWith('standalone_');

  // Form state for multiple catches
  const [formData, setFormData] = useState<MultipleCatchFormData>(() => ({
    tripId: trip.id,
    date: isDirectCatch ? new Date() : new Date(trip.endTime),
    catches: [{
      id: `catch_${Date.now()}`,
      fishGroup: 'reef fish',
      quantity: 0,
      photos: [],
      gps_photo: []
    }],
    noCatch: false
  }));

  // Photo handling
  const addPhotoToCatch = (catchEntryId: string, base64Photo: string, gpsCoordinate?: GPSCoordinate) => {
    console.log('🎯 addPhotoToCatch called:', { 
      catchEntryId, 
      base64Length: base64Photo.length, 
      hasGPS: !!gpsCoordinate,
      gpsCoordinate 
    });
    
    setFormData(prev => {
      const newData = {
        ...prev,
        catches: prev.catches.map(catchEntry => {
          if (catchEntry.id === catchEntryId) {
            const currentPhotos = catchEntry.photos || [];
            const currentGPSCoordinates = catchEntry.gps_photo || [];
            console.log('📷 Current photos count:', currentPhotos.length);
            
            if (currentPhotos.length >= 3) {
              console.warn('⚠️ Max photos reached');
              setError(t('catch.maxPhotosReached'));
              return catchEntry;
            }
            
            const updatedEntry = {
              ...catchEntry,
              photos: [...currentPhotos, base64Photo],
              gps_photo: gpsCoordinate ? [...currentGPSCoordinates, gpsCoordinate] : currentGPSCoordinates
            };
            console.log('✅ Photo added, new count:', updatedEntry.photos.length);
            if (gpsCoordinate) {
              console.log('✅ GPS coordinate added:', gpsCoordinate);
            }
            return updatedEntry;
          }
          return catchEntry;
        })
      };
      
      console.log('📊 Updated form data:', newData);
      return newData;
    });
    setError(null);
  };

  const removePhotoFromCatch = (catchEntryId: string, photoIndex: number) => {
    setFormData(prev => ({
      ...prev,
      catches: prev.catches.map(catchEntry => {
        if (catchEntry.id === catchEntryId) {
          const currentPhotos = catchEntry.photos || [];
          const currentGPSCoordinates = catchEntry.gps_photo || [];
          return {
            ...catchEntry,
            photos: currentPhotos.filter((_, index) => index !== photoIndex),
            gps_photo: currentGPSCoordinates.filter((_, index) => index !== photoIndex)
          };
        }
        return catchEntry;
      })
    }));
  };

  const photoHandling = usePhotoHandling({
    onError: setError,
    onPhotoAdd: addPhotoToCatch,
    onPhotoRemove: removePhotoFromCatch
  });

  // Initialize camera support check
  useEffect(() => {
    photoHandling.checkCameraSupport();
  }, []);

  // Date selection for direct catch reports
  const handleDateSelection = (daysAgo: number) => {
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() - daysAgo);
    setFormData(prev => ({ ...prev, date: selectedDate }));
  };

  // Add a new catch entry
  const addCatchEntry = () => {
    setFormData(prev => ({
      ...prev,
      catches: [...prev.catches, {
        id: `catch_${Date.now()}`,
        fishGroup: 'reef fish',
        quantity: 0,
        photos: [],
        gps_photo: []
      }]
    }));
  };

  // Remove a catch entry
  const removeCatchEntry = (id: string) => {
    setFormData(prev => ({
      ...prev,
      catches: prev.catches.filter(catchEntry => catchEntry.id !== id)
    }));
  };

  // Update a specific catch entry
  const updateCatchEntry = (id: string, field: keyof CatchEntry, value: any) => {
    setFormData(prev => ({
      ...prev,
      catches: prev.catches.map(catchEntry => 
        catchEntry.id === id 
          ? { ...catchEntry, [field]: value }
          : catchEntry
      )
    }));
  };

  // Toggle no catch option
  const toggleNoCatch = () => {
    setFormData(prev => ({
      ...prev,
      noCatch: !prev.noCatch,
      catches: prev.noCatch ? [{
        id: `catch_${Date.now()}`,
        fishGroup: 'reef fish',
        quantity: 0,
        photos: [],
        gps_photo: []
      }] : []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.imeis?.[0]) {
      setError(t('catch.errorNoImei'));
      return;
    }

    // Validate form data
    if (!formData.noCatch) {
      const validCatches = formData.catches.filter(catchEntry => catchEntry.quantity > 0);
      if (validCatches.length === 0) {
        setError(t('catch.errorNoValidCatches'));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      await submitMultipleCatchEvents(formData, currentUser.imeis[0]);
      setSuccess(true);
      
      // Show success message for 2 seconds then call onSuccess
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error submitting catch report:', err);
      setError(err instanceof Error ? err.message : t('catch.errorSubmitting'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal d-block" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <div className="text-success mb-3">
                <IconCheck size={48} />
              </div>
              <h3 className="text-success">{t('catch.reportSubmitted')}</h3>
              <p className="text-muted">{t('catch.reportSubmittedMessage')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal d-block" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl modal-fullscreen-md-down">
        <div className="modal-content">
          <div className="modal-header p-3 p-lg-4">
            <h3 className="modal-title">
              <IconFish className="me-2" size={24} />
              <span className="d-none d-sm-inline">{t('catch.reportCatch')}</span>
              <span className="d-sm-none">{t('catch.reportCatchButton')}</span>
            </h3>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              style={{ minWidth: '44px', minHeight: '44px' }}
            ></button>
          </div>

          <div className="modal-body p-3 p-lg-4">
            {/* Trip Information or Direct Catch Date Selection */}
            {isDirectCatch ? (
              <DateSelector 
                selectedDate={formData.date}
                onDateSelection={handleDateSelection}
              />
            ) : (
              <div className="mb-3 mb-lg-4">
                <div className="d-flex align-items-center text-muted small">
                  <IconCalendar size={16} className="me-2" />
                  <span>{formatTripDate(trip.endTime, t)}</span>
                  <span className="mx-2">•</span>
                  <span>Trip ID: {trip.id.slice(0, 8)}...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger mb-4">
                <div className="d-flex">
                  <div>
                    <IconAlertTriangle className="me-2" />
                  </div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Left Column - Catch Options */}
                <div className="col-12 col-lg-8">
                  {/* No Catch Option */}
                  <div className="card mb-3 mb-lg-4">
                    <div className="card-body p-3 p-lg-4">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="flex-grow-1">
                          <label htmlFor="noCatchToggle" className="d-flex align-items-center mb-2 fw-bold" style={{ cursor: 'pointer' }}>
                            <IconBan className="me-2" size={20} />
                            {t('catch.noCatch')}
                          </label>
                          <p className="text-muted mb-0 small">{t('catch.reportNoCatchDescription')}</p>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="noCatchToggle"
                            checked={formData.noCatch}
                            onChange={toggleNoCatch}
                            disabled={loading}
                            style={{ minWidth: '52px', minHeight: '28px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multiple Catch Entries */}
                  {!formData.noCatch && (
                    <div className="card card-borderless shadow-sm border-primary" style={{ borderWidth: '2px' }}>
                      <div className="card-header bg-primary-lt">
                        <h3 className="card-title d-flex align-items-center text">
                          <IconFish className="me-2" size={20} />
                          <span className="d-none d-sm-inline">{t('catch.catchDetails')}</span>
                          <span className="d-sm-none">{t('catch.catches')}</span>
                        </h3>
                        <div className="card-actions">
                          <button
                            type="button"
                            className="btn btn-primary d-flex align-items-center"
                            onClick={addCatchEntry}
                            disabled={loading || formData.catches.length >= 5}
                            style={{ minHeight: '44px', fontSize: '15px' }}
                          >
                            <IconPlus size={18} className="me-2" />
                            <span className="d-none d-sm-inline">{t('catch.addFishGroup')}</span>
                            <span className="d-sm-none">{t('catch.addCatch')}</span>
                          </button>
                        </div>
                      </div>
                      <div className="card-body p-3 p-lg-4">
                        {formData.catches.map((catchEntry, index) => (
                          <CatchEntryForm
                            key={catchEntry.id}
                            catchEntry={catchEntry}
                            index={index}
                            totalCatches={formData.catches.length}
                            loading={loading}
                            isDarkMode={isDarkMode}
                            fileInputRefs={photoHandling.fileInputRefs}
                            onUpdate={updateCatchEntry}
                            onRemove={removeCatchEntry}
                            onFileUpload={photoHandling.handleFileUpload}
                            onTriggerFileInput={photoHandling.triggerFileInput}
                            onRemovePhoto={photoHandling.removePhoto}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Summary */}
                <div className="col-12 col-lg-4">
                  <CatchSummary
                    noCatch={formData.noCatch}
                    catches={formData.catches}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer p-3 d-flex gap-2">
            <button
              type="button"
              className="btn btn-secondary flex-fill"
              onClick={onClose}
              disabled={loading}
              style={{ minHeight: '48px', fontSize: '16px' }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-fill"
              onClick={handleSubmit}
              disabled={loading || (!formData.noCatch && formData.catches.filter(c => c.quantity > 0).length === 0)}
              style={{ minHeight: '48px', fontSize: '16px' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('common.loading')}...
                </>
              ) : (
                <>
                  <IconCheck className="me-2" size={18} />
                  {formData.noCatch ? t('catch.reportNoCatch') : t('catch.submitReport')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCatchForm;