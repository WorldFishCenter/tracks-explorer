import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconUser,
  IconLock,
  IconPhone,
  IconKey,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconClock
} from '@tabler/icons-react';
import { requestPasswordReset, verifyResetOTP, resetPassword } from '../api/authService';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'request' | 'verify' | 'reset' | 'success';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();

  // Form state for Step 1: Request OTP
  const [identifier, setIdentifier] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Form state for Step 2: Verify OTP
  const [otp, setOtp] = useState('');

  // Form state for Step 3: Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  // UI state
  const [currentStep, setCurrentStep] = useState<Step>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // Resend timer (5 minutes)
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // OTP expiry timer (10 minutes)
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!identifier.trim()) {
      setError(t('auth.forgotPassword.errors.identifierRequired'));
      return;
    }

    if (!phoneNumber.trim()) {
      setError(t('auth.forgotPassword.errors.phoneRequired'));
      return;
    }

    // Simple phone validation - just check it's digits (country code will be added automatically)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '');

    // Accept numbers with or without leading 0, should be 9-10 digits
    if (!/^\d{9,10}$/.test(cleanPhone)) {
      setError(t('auth.forgotPassword.errors.invalidPhone'));
      return;
    }

    setLoading(true);

    try {
      const result = await requestPasswordReset(identifier.trim(), phoneNumber.trim());

      console.log('OTP requested successfully:', result);

      // Store the formatted phone number returned by server for step 2
      if (result.formattedPhone) {
        setPhoneNumber(result.formattedPhone);
      }

      // Move to verify step
      setCurrentStep('verify');
      setOtpExpiry(new Date(Date.now() + result.expiresIn * 1000));

      // Start resend countdown (5 minutes = 300 seconds)
      setResendCountdown(300);
      setCanResend(false);

      setError(null);
    } catch (err: unknown) {
      console.error('Failed to request OTP:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Handle specific error cases
      if (errorMessage.includes('No phone number registered')) {
        setError(t('auth.forgotPassword.errors.noPhoneNumber'));
      } else if (errorMessage.includes('No country registered')) {
        setError('Your account does not have a country registered. Please contact support.');
      } else if (errorMessage.includes('wait') || errorMessage.includes('minute')) {
        setError(t('auth.forgotPassword.errors.rateLimited'));
      } else if (errorMessage.includes('not found') || errorMessage.includes('does not match')) {
        setError(t('auth.forgotPassword.errors.userNotFound'));
      } else {
        setError(t('auth.forgotPassword.errors.codeSendFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setError(null);
    setLoading(true);

    try {
      const result = await requestPasswordReset(identifier.trim(), phoneNumber.trim());

      console.log('OTP resent successfully:', result);

      // Reset OTP expiry and resend countdown
      setOtpExpiry(new Date(Date.now() + result.expiresIn * 1000));
      setResendCountdown(300);
      setCanResend(false);
      setOtp(''); // Clear previous OTP input
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to resend OTP:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage.includes('wait') ? t('auth.forgotPassword.errors.rateLimited') : t('auth.forgotPassword.errors.codeSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!otp.trim()) {
      setError(t('auth.forgotPassword.errors.codeRequired'));
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError(t('auth.forgotPassword.errors.invalidCode'));
      return;
    }

    setLoading(true);

    try {
      const result = await verifyResetOTP(phoneNumber.trim(), otp.trim());

      console.log('OTP verified successfully:', result);

      // Move to reset password step
      setResetToken(result.resetToken);
      setCurrentStep('reset');
      setError(null);
      setAttemptsLeft(null);
    } catch (err: unknown) {
      console.error('Failed to verify OTP:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Parse attempts left from error if available
      if (errorMessage.includes('attempts')) {
        const match = errorMessage.match(/(\d+)/);
        if (match) {
          setAttemptsLeft(parseInt(match[1], 10));
        }
      }

      if (errorMessage.includes('expired')) {
        setError(t('auth.forgotPassword.errors.expiredOTP'));
      } else if (errorMessage.includes('Too many')) {
        setError(t('auth.forgotPassword.errors.tooManyAttempts'));
      } else if (errorMessage.includes('Invalid')) {
        setError(t('auth.forgotPassword.errors.invalidOTP'));
      } else {
        setError(t('auth.forgotPassword.errors.invalidOTP'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword) {
      setError(t('auth.forgotPassword.errors.passwordRequired'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.forgotPassword.errors.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.forgotPassword.errors.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      await resetPassword(resetToken, newPassword);

      console.log('Password reset successfully');

      // Move to success step
      setCurrentStep('success');
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to reset password:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('expired')) {
        setError(t('auth.forgotPassword.errors.expiredOTP'));
        // Go back to step 1
        setTimeout(() => {
          setCurrentStep('request');
          setOtp('');
          setResetToken('');
        }, 3000);
      } else {
        setError(t('auth.forgotPassword.errors.resetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle success - close modal and notify parent
  const handleSuccessClose = () => {
    onSuccess();
    onClose();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'request':
        return (
          <form onSubmit={handleRequestOTP}>
            <div className="modal-body">
              <p className="text-muted mb-4">{t('auth.forgotPassword.description')}</p>

              {/* Identifier Field */}
              <div className="mb-3">
                <label className="form-label required">{t('auth.forgotPassword.identifier')}</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconUser size={20} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('auth.forgotPassword.identifierPlaceholder')}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="mb-3">
                <label className="form-label required">{t('auth.forgotPassword.phoneNumber')}</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconPhone size={20} />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder={t('auth.forgotPassword.phoneNumberPlaceholder')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <small className="form-hint">{t('auth.forgotPassword.phoneNumberHint')}</small>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <IconAlertTriangle size={20} className="me-2" />
                  <div>{error}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-link" onClick={onClose} disabled={loading}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {t('auth.forgotPassword.sendingCode')}
                  </>
                ) : (
                  t('auth.forgotPassword.sendCode')
                )}
              </button>
            </div>
          </form>
        );

      case 'verify':
        return (
          <form onSubmit={handleVerifyOTP}>
            <div className="modal-body">
              {/* Success message for code sent */}
              <div className="alert alert-success d-flex align-items-center mb-4">
                <IconCheck size={20} className="me-2" />
                <div>
                  <strong>{t('auth.forgotPassword.codeSent')}</strong>
                  <br />
                  <small>{t('auth.forgotPassword.codeSentMessage', { phone: phoneNumber })}</small>
                </div>
              </div>

              {/* OTP Input */}
              <div className="mb-3">
                <label className="form-label required">{t('auth.forgotPassword.verificationCode')}</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconKey size={20} />
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    placeholder={t('auth.forgotPassword.verificationCodePlaceholder')}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={loading}
                    autoFocus
                    maxLength={6}
                    style={{ letterSpacing: '0.5em', fontWeight: 'bold' }}
                  />
                </div>
                <small className="form-hint">{t('auth.forgotPassword.verificationCodeHint')}</small>
              </div>

              {/* Attempts left warning */}
              {attemptsLeft !== null && attemptsLeft > 0 && (
                <div className="alert alert-warning d-flex align-items-center">
                  <IconAlertTriangle size={20} className="me-2" />
                  <div>{attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left</div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <IconAlertTriangle size={20} className="me-2" />
                  <div>{error}</div>
                </div>
              )}

              {/* Resend Code Button */}
              <div className="text-center mt-3">
                {canResend ? (
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    {loading ? t('auth.forgotPassword.resendingCode') : t('auth.forgotPassword.resendCode')}
                  </button>
                ) : (
                  <div className="text-muted small">
                    <IconClock size={16} className="me-1" />
                    {t('auth.forgotPassword.canResendIn', { seconds: resendCountdown })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-link" onClick={() => setCurrentStep('request')} disabled={loading}>
                {t('common.back')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {t('auth.forgotPassword.verifying')}
                  </>
                ) : (
                  t('auth.forgotPassword.verifyCode')
                )}
              </button>
            </div>
          </form>
        );

      case 'reset':
        return (
          <form onSubmit={handleResetPassword}>
            <div className="modal-body">
              {/* Success message for code verified */}
              <div className="alert alert-success d-flex align-items-center mb-4">
                <IconCheck size={20} className="me-2" />
                <div>
                  <strong>{t('auth.forgotPassword.codeVerified')}</strong>
                  <br />
                  <small>{t('auth.forgotPassword.codeVerifiedMessage')}</small>
                </div>
              </div>

              {/* New Password Field */}
              <div className="mb-3">
                <label className="form-label required">{t('auth.forgotPassword.newPassword')}</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconLock size={20} />
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={t('auth.forgotPassword.newPasswordPlaceholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-3">
                <label className="form-label required">{t('auth.forgotPassword.confirmPassword')}</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconLock size={20} />
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={t('auth.forgotPassword.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <IconAlertTriangle size={20} className="me-2" />
                  <div>{error}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-link" onClick={onClose} disabled={loading}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    {t('auth.forgotPassword.resetting')}
                  </>
                ) : (
                  t('auth.forgotPassword.resetPassword')
                )}
              </button>
            </div>
          </form>
        );

      case 'success':
        return (
          <div className="modal-body text-center">
            <div className="mb-4">
              <div className="avatar avatar-xl bg-success text-white mb-3">
                <IconCheck size={40} />
              </div>
              <h3 className="mb-2">{t('auth.forgotPassword.success')}</h3>
              <p className="text-muted">{t('auth.forgotPassword.successMessage')}</p>
            </div>
            <button className="btn btn-primary" onClick={handleSuccessClose}>
              {t('auth.forgotPassword.backToLogin')}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 'request':
        return t('auth.forgotPassword.step1Title');
      case 'verify':
        return t('auth.forgotPassword.step2Title');
      case 'reset':
        return t('auth.forgotPassword.step3Title');
      case 'success':
        return t('auth.forgotPassword.success');
      default:
        return t('auth.forgotPassword.title');
    }
  };

  return (
    <div className="modal modal-blur fade show" style={{ display: 'block' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{getStepTitle()}</h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading} />
          </div>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
