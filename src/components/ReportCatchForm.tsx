import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconFish, IconWeight, IconList, IconCheck, IconAlertTriangle, IconCalendar } from '@tabler/icons-react';
import { Trip, FishGroup, CatchEventFormData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { submitCatchEvent } from '../api/catchEventsService';
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

  // Form state - using trip's end date as the catch date (memoized to prevent re-initialization)
  const [formData, setFormData] = useState<CatchEventFormData>(() => ({
    tripId: trip.id,
    date: new Date(trip.endTime), // Use trip's end time as the catch date
    fishGroup: 'reef fish',
    quantity: 0
  }));

  const handleFishGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, fishGroup: e.target.value as FishGroup }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, quantity: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.imeis?.[0]) {
      setError(t('catch.errorNoImei'));
      return;
    }

    if (formData.quantity <= 0) {
      setError(t('catch.errorInvalidQuantity'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitCatchEvent(formData, currentUser.imeis[0]);
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
      <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <IconFish className="me-2" size={24} />
              {t('catch.reportCatch')}
            </h3>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {/* Trip Information */}
            <div className="alert alert-info mb-3">
              <div className="d-flex">
                <div>
                  <IconFish className="me-2" />
                </div>
                <div>
                  <strong>{t('catch.reportingForTrip')}:</strong> {trip.boatName}
                  <br />
                  <small className="text-muted">
                    <IconCalendar size={14} className="me-1" />
                    {formatTripDate(trip.endTime, t)} • ID: {trip.id.slice(0, 8)}...
                  </small>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <div className="d-flex">
                  <div>
                    <IconAlertTriangle className="me-2" />
                  </div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Fish Group Field */}
              <div className="mb-3">
                <label className="form-label">
                  <IconList className="me-1" size={16} />
                  {t('catch.fishGroup')}
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <IconList size={16} />
                  </span>
                  <select
                    className="form-select"
                    value={formData.fishGroup}
                    onChange={handleFishGroupChange}
                    disabled={loading}
                    required
                  >
                    {FISH_GROUPS.map(group => (
                      <option key={group} value={group}>
                        {t(`catch.fishGroups.${group.replace(/[^a-zA-Z]/g, '')}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Field */}
              <div className="mb-3">
                <label className="form-label">
                  <IconWeight className="me-1" size={16} />
                  {t('catch.quantity')}
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <IconWeight size={16} />
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantity || ''}
                    onChange={handleQuantityChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    disabled={loading}
                    required
                  />
                  <span className="input-group-text">kg</span>
                </div>
                <div className="form-hint">
                  {t('catch.quantityHint')}
                </div>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ minHeight: '44px' }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || formData.quantity <= 0}
              style={{ minHeight: '44px' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('common.loading')}...
                </>
              ) : (
                <>
                  <IconCheck className="me-1" size={16} />
                  {t('catch.submitReport')}
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