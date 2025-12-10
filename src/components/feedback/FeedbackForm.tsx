import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { submitFeedback, FeedbackSubmission } from '../../api/feedbackService';

interface FeedbackFormProps {
  onSuccess?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Simple unified feedback types
  const feedbackTypes = [
    { value: 'opinion', labelKey: 'feedback.types.opinion' },
    { value: 'problem', labelKey: 'feedback.types.problem' },
    { value: 'suggestion', labelKey: 'feedback.types.suggestion' },
    { value: 'question', labelKey: 'feedback.types.question' },
    { value: 'other', labelKey: 'feedback.types.other' }
  ];

  const maxMessageLength = 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation - only type and message required
    if (!type) {
      setError(t('feedback.form.typeRequired'));
      return;
    }

    if (!message.trim()) {
      setError(t('feedback.form.messageRequired'));
      return;
    }

    if (message.trim().length > maxMessageLength) {
      setError(t('feedback.form.messageTooLong', { max: maxMessageLength }));
      return;
    }

    // Get user identifier
    const imei = currentUser?.imeis?.[0] || null;
    const username = currentUser?.username || null;

    if (!imei && !username) {
      setError(t('feedback.errors.submitFailed'));
      return;
    }

    setLoading(true);

    try {
      const feedbackData: FeedbackSubmission = {
        type,
        message: message.trim()
      };

      await submitFeedback(feedbackData, imei, username);

      setSuccess(true);

      // Reset form
      setType('');
      setMessage('');

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : t('feedback.errors.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="alert alert-success" role="alert">
        <div className="d-flex">
          <div>
            <IconCheck className="me-2" />
          </div>
          <div>
            <h4 className="alert-title">{t('feedback.form.success')}</h4>
            <div className="text-secondary">{t('feedback.form.successMessage')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          <div className="d-flex">
            <div>
              <IconAlertTriangle className="me-2" />
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Type Selection */}
      <div className="mb-3">
        <label className="form-label required">
          {t('feedback.form.type')}
        </label>
        <select
          className="form-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={loading}
          required
        >
          <option value="">{t('feedback.form.selectType')}</option>
          {feedbackTypes.map((typeOption) => (
            <option key={typeOption.value} value={typeOption.value}>
              {t(typeOption.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div className="mb-3">
        <label className="form-label required">
          {t('feedback.form.message')}
        </label>
        <textarea
          className="form-control"
          rows={6}
          placeholder={t('feedback.form.messagePlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          maxLength={maxMessageLength}
          required
        />
        <div className="form-hint">
          {maxMessageLength - message.length} {t('feedback.form.charactersRemaining')}
        </div>
      </div>

      {/* Submit Button */}
      <div className="form-footer">
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {t('feedback.form.submitting')}
            </>
          ) : (
            t('feedback.form.submit')
          )}
        </button>
      </div>
    </form>
  );
};

export default FeedbackForm;

