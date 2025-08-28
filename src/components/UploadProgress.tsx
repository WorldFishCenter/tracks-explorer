import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  IconCloudUpload, 
  IconCheck, 
  IconX, 
  IconRefresh, 
  IconWifi, 
  IconWifiOff,
  IconClock,
  IconAlertTriangle 
} from '@tabler/icons-react';
import { uploadManager, UploadProgress } from '../utils/uploadManager';

interface UploadProgressProps {
  compact?: boolean;
  showStats?: boolean;
}

const UploadProgressComponent: React.FC<UploadProgressProps> = ({ compact = false, showStats = true }) => {
  const { t } = useTranslation();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    // Subscribe to upload progress
    const unsubscribe = uploadManager.onProgressUpdate(setUploads);

    // Listen to network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get initial stats
    uploadManager.getStats().then(setStats);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      uploadManager.getStats().then(setStats);
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'retrying':
        return <IconCloudUpload className="text-primary" size={16} />;
      case 'completed':
        return <IconCheck className="text-success" size={16} />;
      case 'failed':
        return <IconX className="text-danger" size={16} />;
      case 'pending':
        return <IconClock className="text-muted" size={16} />;
      default:
        return <IconCloudUpload className="text-muted" size={16} />;
    }
  };

  const getStatusText = (upload: UploadProgress) => {
    switch (upload.status) {
      case 'uploading':
        return t('common.loading');
      case 'retrying':
        return `${t('common.tryAgain')} (${upload.retryCount}/5)`;
      case 'completed':
        return t('common.success');
      case 'failed':
        return upload.error || t('common.error');
      case 'pending':
        return upload.nextRetryAt 
          ? `${t('common.next')} ${new Date(upload.nextRetryAt).toLocaleTimeString()}`
          : t('common.pleaseWait');
      default:
        return upload.status;
    }
  };

  const handleRetry = (uploadId: string) => {
    uploadManager.retryUpload(uploadId);
  };

  const handleCancel = (uploadId: string) => {
    uploadManager.cancelUpload(uploadId);
  };

  const activeUploads = uploads.filter(u => u.status !== 'completed');
  const failedUploads = uploads.filter(u => u.status === 'failed');
  const completedUploads = uploads.filter(u => u.status === 'completed');

  // Don't render if no uploads and not showing stats
  if (activeUploads.length === 0 && !showStats && completedUploads.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2">
        {/* Network status */}
        <div className="d-flex align-items-center">
          {isOnline ? (
            <IconWifi size={16} className="text-success" />
          ) : (
            <IconWifiOff size={16} className="text-danger" />
          )}
        </div>

        {/* Active uploads indicator */}
        {activeUploads.length > 0 && (
          <div className="d-flex align-items-center gap-1">
            <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '12px', height: '12px' }}>
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <small className="text-muted">{activeUploads.length}</small>
          </div>
        )}

        {/* Failed uploads indicator */}
        {failedUploads.length > 0 && (
          <div className="d-flex align-items-center gap-1">
            <IconAlertTriangle size={14} className="text-warning" />
            <small className="text-warning">{failedUploads.length}</small>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header py-2">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <IconCloudUpload size={18} className="text-primary" />
            <h6 className="mb-0">{t('upload.uploadStatus')}</h6>
          </div>
          <div className="d-flex align-items-center gap-2">
            {isOnline ? (
              <div className="d-flex align-items-center gap-1">
                <IconWifi size={14} className="text-success" />
                <small className="text-success">{t('network.online')}</small>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-1">
                <IconWifiOff size={14} className="text-danger" />
                <small className="text-danger">{t('network.offline')}</small>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="card-body p-3">
        {/* Active uploads */}
        {activeUploads.map((upload) => (
          <div key={upload.id} className="d-flex align-items-center mb-3">
            <div className="me-3">
              {getStatusIcon(upload.status)}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="fw-medium">
                  {upload.type === 'photo' ? t('upload.photoUpload') : t('upload.catchReportUpload')}
                </small>
                <small className="text-muted">
                  {upload.status === 'uploading' || upload.status === 'retrying' 
                    ? `${Math.round(upload.progress)}%` 
                    : getStatusText(upload)}
                </small>
              </div>
              
              {(upload.status === 'uploading' || upload.status === 'retrying') && (
                <div className="progress" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              
              {upload.status === 'failed' && (
                <div className="mt-1">
                  <small className="text-danger d-block mb-2">{upload.error}</small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleRetry(upload.id)}
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                    >
                      <IconRefresh size={12} className="me-1" />
                      {t('upload.retry')}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleCancel(upload.id)}
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                    >
                      <IconX size={12} className="me-1" />
                      {t('upload.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Recent completed uploads */}
        {completedUploads.slice(-3).map((upload) => (
          <div key={upload.id} className="d-flex align-items-center mb-2 opacity-75">
            <div className="me-3">
              {getStatusIcon(upload.status)}
            </div>
            <div className="flex-grow-1">
              <small className="text-muted">
                {upload.type === 'photo' ? t('upload.photoUpload') : t('upload.catchReportUpload')} - {getStatusText(upload)}
              </small>
            </div>
          </div>
        ))}

        {/* Upload stats */}
        {showStats && stats && (
          <div className="mt-3 pt-3 border-top">
            <div className="row g-2 text-center">
              <div className="col-4">
                <div className="small text-muted">{t('upload.pending')}</div>
                <div className="fw-bold text-warning">{stats.pendingCatches + stats.pendingPhotos || 0}</div>
              </div>
              <div className="col-4">
                <div className="small text-muted">{t('upload.active')}</div>
                <div className="fw-bold text-primary">{stats.active || 0}</div>
              </div>
              <div className="col-4">
                <div className="small text-muted">{t('upload.failed')}</div>
                <div className="fw-bold text-danger">{stats.failed || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* No uploads message */}
        {activeUploads.length === 0 && completedUploads.length === 0 && (
          <div className="text-center text-muted py-3">
            <IconCheck size={24} className="mb-2 opacity-50" />
            <div>{t('upload.noActiveUploads')}</div>
          </div>
        )}
      </div>

      {/* Clear completed button */}
      {completedUploads.length > 0 && (
        <div className="card-footer py-2">
          <button
            className="btn btn-sm btn-outline-secondary w-100"
            onClick={() => uploadManager.clearCompleted()}
            style={{ fontSize: '12px' }}
          >
            {t('upload.clearCompleted')} ({completedUploads.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadProgressComponent;