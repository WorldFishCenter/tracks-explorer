import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fish, Check, AlertTriangle, Calendar, Plus, Ban, X } from 'lucide-react';
import { Trip, FishGroup, MultipleCatchFormData, CatchEntry } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { submitMultipleCatchEvents } from '../../api/catchEventsService';
import { formatTripDate } from '../../utils/formatters';
import { usePhotoHandling } from './hooks/usePhotoHandling';
import DateSelector from './DateSelector';
import CatchEntryForm from './CatchEntryForm';
import CatchSummary from './CatchSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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
      photos: []
    }],
    noCatch: false
  }));

  // Photo handling
  const addPhotoToCatch = (catchEntryId: string, base64Photo: string) => {
    console.log('🎯 addPhotoToCatch called:', { catchEntryId, base64Length: base64Photo.length });
    
    setFormData(prev => {
      const newData = {
        ...prev,
        catches: prev.catches.map(catchEntry => {
          if (catchEntry.id === catchEntryId) {
            const currentPhotos = catchEntry.photos || [];
            console.log('📷 Current photos count:', currentPhotos.length);
            
            if (currentPhotos.length >= 3) {
              console.warn('⚠️ Max photos reached');
              setError(t('catch.maxPhotosReached'));
              return catchEntry;
            }
            
            const updatedEntry = {
              ...catchEntry,
              photos: [...currentPhotos, base64Photo]
            };
            console.log('✅ Photo added, new count:', updatedEntry.photos.length);
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
          return {
            ...catchEntry,
            photos: currentPhotos.filter((_, index) => index !== photoIndex)
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
        photos: []
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
        photos: []
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
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 text-green-500">
              <Check size={48} />
            </div>
            <h3 className="text-lg font-semibold text-green-500 mb-2">{t('catch.reportSubmitted')}</h3>
            <p className="text-muted-foreground">{t('catch.reportSubmittedMessage')}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 lg:p-6 border-b">
          <DialogTitle className="flex items-center text-xl">
            <Fish className="mr-2 h-6 w-6" />
            <span className="hidden sm:inline">{t('catch.reportCatch')}</span>
            <span className="sm:hidden">{t('catch.reportCatchButton')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Trip Information or Direct Catch Date Selection */}
          {isDirectCatch ? (
            <DateSelector 
              selectedDate={formData.date}
              onDateSelection={handleDateSelection}
            />
          ) : (
            <div className="mb-4 lg:mb-6">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar size={16} className="mr-2" />
                <span>{formatTripDate(trip.endTime, t)}</span>
                <span className="mx-2">•</span>
                <span>Trip ID: {trip.id.slice(0, 8)}...</span>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Catch Options */}
              <div className="lg:col-span-2 space-y-4">
                {/* No Catch Option */}
                <Card>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor="noCatchToggle" className="flex items-center text-base font-semibold cursor-pointer">
                          <Ban className="mr-2 h-5 w-5" />
                          {t('catch.noCatch')}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{t('catch.reportNoCatchDescription')}</p>
                      </div>
                      <Switch
                        id="noCatchToggle"
                        checked={formData.noCatch}
                        onCheckedChange={toggleNoCatch}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Multiple Catch Entries */}
                {!formData.noCatch && (
                  <Card className="border-2 border-primary">
                    <CardHeader className="bg-primary/5">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Fish className="mr-2 h-5 w-5" />
                          <span className="hidden sm:inline">{t('catch.catchDetails')}</span>
                          <span className="sm:hidden">{t('catch.catches')}</span>
                        </CardTitle>
                        <Button
                          type="button"
                          onClick={addCatchEntry}
                          disabled={loading || formData.catches.length >= 5}
                          className="h-11"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">{t('catch.addFishGroup')}</span>
                          <span className="sm:hidden">{t('catch.addCatch')}</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 lg:p-6">
                      <div className="space-y-4">
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
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-1">
                <CatchSummary
                  noCatch={formData.noCatch}
                  catches={formData.catches}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="p-4 border-t flex-row gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 text-base"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || (!formData.noCatch && formData.catches.filter(c => c.quantity > 0).length === 0)}
            className="flex-1 h-12 text-base"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('common.loading')}...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {formData.noCatch ? t('catch.reportNoCatch') : t('catch.submitReport')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportCatchForm;