import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconWifi, IconWifiOff, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface NetworkStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ compact = false, showDetails = true }) => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  const [downlink, setDownlink] = useState<number>(0);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnectedMessage, setShowReconnectedMessage] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      
      // Track if we were offline and now came back online
      if (!isOnline && online) {
        setWasOffline(true);
        setShowReconnectedMessage(true);
        // Hide reconnected message after 5 seconds
        setTimeout(() => setShowReconnectedMessage(false), 5000);
      }
      
      setIsOnline(online);
    };

    const updateConnectionInfo = () => {
      // @ts-ignore - Connection API might not be fully typed
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
        setDownlink(connection.downlink || 0);
      }
    };

    // Listen for network changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for connection changes if supported
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Initial setup
    updateOnlineStatus();
    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [isOnline]);

  const getConnectionQuality = () => {
    if (!isOnline) return 'offline';
    
    if (effectiveType === '4g' || effectiveType === '3g') {
      return downlink > 1.5 ? 'excellent' : downlink > 0.5 ? 'good' : 'poor';
    }
    
    if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      return 'poor';
    }
    
    return 'unknown';
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <IconWifiOff className="text-danger" size={16} />;
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent':
        return <IconWifi className="text-success" size={16} />;
      case 'good':
        return <IconWifi className="text-primary" size={16} />;
      case 'poor':
        return <IconWifi className="text-warning" size={16} />;
      default:
        return <IconWifi className="text-muted" size={16} />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return t('network.offline');
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent':
        return t('network.excellentConnection');
      case 'good':
        return t('network.goodConnection');
      case 'poor':
        return t('network.poorConnection');
      default:
        return t('network.online');
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-danger';
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'excellent':
        return 'text-success';
      case 'good':
        return 'text-primary';
      case 'poor':
        return 'text-warning';
      default:
        return 'text-muted';
    }
  };

  if (compact) {
    return (
      <div className="d-flex align-items-center gap-2">
        {getConnectionIcon()}
        {showReconnectedMessage && (
          <small className="text-success fw-medium">
            <IconCheck size={12} className="me-1" />
            {t('network.backOnline')}
          </small>
        )}
      </div>
    );
  }

  // Show reconnection alert
  if (showReconnectedMessage) {
    return (
      <div className="alert alert-success d-flex align-items-center mb-2" role="alert">
        <IconCheck size={20} className="me-2" />
        <div>
          <strong>{t('network.connectionRestored')}</strong>
          <div className="small">{t('network.pendingUploadsWillResume')}</div>
        </div>
      </div>
    );
  }

  // Show offline warning
  if (!isOnline) {
    return (
      <div className="alert alert-warning d-flex align-items-center mb-2" role="alert">
        <IconWifiOff size={20} className="me-2" />
        <div>
          <strong>{t('network.youreOffline')}</strong>
          <div className="small">{t('network.dataWillBeSaved')}</div>
        </div>
      </div>
    );
  }

  // Show poor connection warning
  if (getConnectionQuality() === 'poor') {
    return (
      <div className="alert alert-info d-flex align-items-center mb-2" role="alert">
        <IconAlertTriangle size={20} className="me-2" />
        <div>
          <strong>{t('network.slowConnectionDetected')}</strong>
          <div className="small">{t('network.uploadsMayTakeLonger')}</div>
        </div>
      </div>
    );
  }

  if (!showDetails) {
    return null;
  }

  return (
    <div className="card border-0 bg-light">
      <div className="card-body py-2 px-3">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            {getConnectionIcon()}
            <small className={`fw-medium ${getStatusColor()}`}>
              {getStatusText()}
            </small>
          </div>
          {showDetails && connectionType !== 'unknown' && (
            <div className="d-flex gap-2">
              <small className="text-muted">{effectiveType?.toUpperCase()}</small>
              {downlink > 0 && (
                <small className="text-muted">{downlink.toFixed(1)} Mbps</small>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;