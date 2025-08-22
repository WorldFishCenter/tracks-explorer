import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFish, IconWeight, IconList, IconCheck, IconAlertTriangle, IconCalendar, IconPlus, IconTrash, IconBan } from '@tabler/icons-react';
import { Trip, FishGroup, MultipleCatchFormData, CatchEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitMultipleCatchEvents } from '../api/catchEventsService';
import { formatTripDate } from '../utils/formatters';

interface ReportCatchFormProps {
  trip: Trip;
  onClose: () => void;
  onSuccess: () => void;
}

const FISH_GROUPS: FishGroup[] = [
  'reef fish',
  'sharks/rays', 
  'small pelagics',
  'large pelagics',
  'tuna/tuna-like'
];

const ReportCatchForm: React.FC<ReportCatchFormProps> = ({ trip, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection effect
  useEffect(() => {
    const detectTheme = () => {
      const theme = document.documentElement.getAttribute('data-bs-theme');
      setIsDarkMode(theme === 'dark');
    };
    
    // Initial detection
    detectTheme();
    
    // Listen for theme changes
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
    
    return () => observer.disconnect();
  }, []);

  // Check if this is a direct catch report (standalone trip)
  const isDirectCatch = trip.id.startsWith('standalone_');

  // Form state for multiple catches
  const [formData, setFormData] = useState<MultipleCatchFormData>(() => ({
    tripId: trip.id,
    date: isDirectCatch ? new Date() : new Date(trip.endTime), // Default to today for direct catch
    catches: [{
      id: `catch_${Date.now()}`,
      fishGroup: 'reef fish',
      quantity: 0
    }],
    noCatch: false
  }));

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
        quantity: 0
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
        quantity: 0
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
              /* Direct Catch Date Selection */
              <div className="mb-3 mb-lg-4">
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
                  <h4 className="mb-0">{t('catch.whenWasCatchMade')}</h4>
                  <div className="btn-group" role="group">
                    <input type="radio" className="btn-check" name="catchDate" id="today" autoComplete="off" defaultChecked />
                    <label className="btn btn-outline-primary" htmlFor="today" onClick={() => handleDateSelection(0)}>
                      {t('catch.today')}
                    </label>
                    
                    <input type="radio" className="btn-check" name="catchDate" id="yesterday" autoComplete="off" />
                    <label className="btn btn-outline-primary" htmlFor="yesterday" onClick={() => handleDateSelection(1)}>
                      {t('catch.yesterday')}
                    </label>
                    
                    <input type="radio" className="btn-check" name="catchDate" id="twoDaysAgo" autoComplete="off" />
                    <label className="btn btn-outline-primary" htmlFor="twoDaysAgo" onClick={() => handleDateSelection(2)}>
                      {t('catch.twoDaysAgo')}
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular Trip Information - Single Line */
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
                    <div className="card">
                      <div className="card-header">
                        <h3 className="card-title d-flex align-items-center">
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
                          <div key={catchEntry.id} className={`catch-entry ${index > 0 ? 'border-top pt-3 mt-3' : ''} ${index < formData.catches.length - 1 ? 'mb-3' : ''}`}>
                            <div className="row g-3">
                              <div className="col-12 col-sm-6 col-lg-5">
                                <label className="form-label fw-medium mb-2 d-flex align-items-center">
                                  <IconList className="me-2" size={16} />
                                  {t('catch.fishGroup')}
                                </label>
                                <select
                                  className="form-select"
                                  value={catchEntry.fishGroup}
                                  onChange={(e) => updateCatchEntry(catchEntry.id, 'fishGroup', e.target.value as FishGroup)}
                                  disabled={loading}
                                  required
                                  style={{ minHeight: '50px', fontSize: '16px', padding: '12px 16px' }}
                                >
                                  {FISH_GROUPS.map(group => (
                                    <option key={group} value={group}>
                                      {t(`catch.fishGroups.${group.replace(/[^a-zA-Z]/g, '')}`)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-8 col-sm-4 col-lg-5">
                                <label className="form-label fw-medium mb-2 d-flex align-items-center">
                                  <IconWeight className="me-2" size={16} />
                                  {t('catch.weightKg')}
                                </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={catchEntry.quantity || ''}
                                  onChange={(e) => updateCatchEntry(catchEntry.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  onWheel={(e) => e.currentTarget.blur()} // Prevent scroll from changing value
                                  placeholder="0.0"
                                  min="0"
                                  step="0.1"
                                  disabled={loading}
                                  style={{ minHeight: '50px', fontSize: '16px', padding: '12px 16px' }}
                                />
                              </div>
                              <div className="col-4 col-sm-2 col-lg-2">
                                {formData.catches.length > 1 && (
                                  <>
                                    <label className="form-label opacity-0 mb-2 d-flex align-items-center">
                                      <span className="me-2" style={{ width: '16px' }}></span>
                                      {t('catch.remove')}
                                    </label>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                                      onClick={() => removeCatchEntry(catchEntry.id)}
                                      disabled={loading}
                                      title={t('catch.removeCatchEntry')}
                                      style={{ minHeight: '50px', fontSize: '15px' }}
                                    >
                                      <IconTrash size={18} />
                                      <span className="d-none d-lg-inline ms-1">{t('catch.remove')}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* {formData.catches.length < 5 && (
                          <div className="text-muted small mt-3 text-center">
                            {t('catch.youCanAddUpTo')}
                          </div>
                        )} */}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Summary */}
                <div className="col-12 col-lg-4">
                  <div className={`card ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
                    <div className="card-header p-3">
                      <h5 className="card-title mb-0">{t('catch.summary')}</h5>
                    </div>
                    <div className="card-body p-3">
                      {formData.noCatch ? (
                        <div className="text-center text-muted">
                          <IconBan size={32} className="mb-2" />
                          <p>{t('catch.noCatchWillBeReported')}</p>
                        </div>
                      ) : (
                        <>
                          <h6 className="mb-2">{t('catch.catchEntries')}:</h6>
                          {formData.catches.map((catchEntry, index) => (
                            <div key={catchEntry.id} className="d-flex justify-content-between mb-1 small">
                              <span>{t(`catch.fishGroups.${catchEntry.fishGroup.replace(/[^a-zA-Z]/g, '')}`)}</span>
                              <span className="fw-bold">{catchEntry.quantity || 0} kg</span>
                            </div>
                          ))}
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>{t('catch.totalWeight')}:</span>
                            <span>{formData.catches.reduce((sum, catchEntry) => sum + (catchEntry.quantity || 0), 0).toFixed(1)} kg</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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