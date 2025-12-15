import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconMapPin, IconX } from '@tabler/icons-react';
import { WaypointFormData, WaypointType } from '../../types';

interface AddWaypointModalProps {
  onSave: (data: WaypointFormData) => Promise<void>;
  onClose: () => void;
  initialCoordinates?: { lat: number; lng: number } | null;
}

const AddWaypointModal: React.FC<AddWaypointModalProps> = ({
  onSave,
  onClose,
  initialCoordinates
}) => {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<WaypointType>('favorite_spot');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialCoordinates || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection and body scroll lock effect
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

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      observer.disconnect();
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Update coordinates when initialCoordinates prop changes
  useEffect(() => {
    if (initialCoordinates) {
      setCoordinates(initialCoordinates);
    }
  }, [initialCoordinates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('waypoints.errors.nameRequired'));
      return;
    }

    if (!coordinates) {
      setError(t('waypoints.errors.locationRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData: WaypointFormData = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        coordinates
      };

      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving waypoint:', err);
      setError(err instanceof Error ? err.message : t('waypoints.errors.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const waypointTypes: { value: WaypointType; label: string; icon: string }[] = [
    { value: 'port', label: t('waypoints.types.port'), icon: 'bi-building' },
    { value: 'anchorage', label: t('waypoints.types.anchorage'), icon: 'bi-anchor' },
    { value: 'fishing_ground', label: t('waypoints.types.fishing_ground'), icon: 'bi-star-fill' },
    { value: 'favorite_spot', label: t('waypoints.types.favorite_spot'), icon: 'bi-heart-fill' },
    { value: 'other', label: t('waypoints.types.other'), icon: 'bi-pin-map-fill' }
  ];

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Modal */}
      <div
        className="modal modal-blur fade show"
        style={{ display: 'block' }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                <IconMapPin className="me-2" size={24} />
                {t('waypoints.form.title')}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label={t('common.close')}
              />
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Error message */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <div className="d-flex align-items-center">
                      <IconX className="me-2" size={20} />
                      <div>{error}</div>
                    </div>
                  </div>
                )}

                {/* Name field */}
                <div className="mb-3">
                  <label className="form-label required">{t('waypoints.form.nameLabel')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('waypoints.form.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                  <small className="form-hint">{t('waypoints.form.nameHint')}</small>
                </div>

                {/* Type field */}
                <div className="mb-3">
                  <label className="form-label required">{t('waypoints.form.typeLabel')}</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value as WaypointType)}
                    required
                  >
                    {waypointTypes.map(wt => (
                      <option key={wt.value} value={wt.value}>
                        {wt.label}
                      </option>
                    ))}
                  </select>
                  <small className="form-hint">{t('waypoints.form.typeHint')}</small>
                </div>

                {/* Description field */}
                <div className="mb-3">
                  <label className="form-label">{t('waypoints.form.descriptionLabel')}</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder={t('waypoints.form.descriptionPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <small className="form-hint">
                    {t('waypoints.form.descriptionHint')}
                  </small>
                </div>

                {/* Coordinates section */}
                <div className="mb-3">
                  <label className="form-label required">{t('waypoints.form.locationLabel')}</label>
                  {coordinates ? (
                    <div className="card">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="text-muted small">{t('waypoints.form.latitude')}</div>
                            <div className="fw-bold">{coordinates.lat.toFixed(6)}</div>
                          </div>
                          <div>
                            <div className="text-muted small">{t('waypoints.form.longitude')}</div>
                            <div className="fw-bold">{coordinates.lng.toFixed(6)}</div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost-danger"
                            onClick={() => setCoordinates(null)}
                          >
                            {t('waypoints.form.clear')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info mb-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i>
                        <div>
                          {t('waypoints.form.locationInstructions')}
                        </div>
                      </div>
                    </div>
                  )}
                  <small className="form-hint">
                    {t('waypoints.form.locationHint')}
                  </small>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-link link-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !name.trim() || !coordinates}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      {t('waypoints.form.saving')}
                    </>
                  ) : (
                    <>
                      <IconMapPin className="me-2" size={18} />
                      {t('waypoints.form.saveButton')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddWaypointModal;
