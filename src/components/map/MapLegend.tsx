import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconSpeedboat, IconMapPin } from '@tabler/icons-react';

interface MapLegendProps {
  showActivityGrid: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showActivityGrid }) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile: Balanced compact legend */}
      <div 
        className="d-md-none card border-0 shadow-sm"
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(var(--tblr-body-bg-rgb), 0.75)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          width: '140px'
        }}
      >
        <div className="card-body p-2">
          <div className="d-flex align-items-center mb-1">
            {showActivityGrid ? (
              <IconMapPin size={14} className="text-primary me-1" />
            ) : (
              <IconSpeedboat size={14} className="text-primary me-1" />
            )}
            <span className="small fw-medium" style={{ fontSize: '0.75rem' }}>
              {showActivityGrid ? t('common.visitFrequency') : t('common.speed')}
            </span>
          </div>
          
          <div className="mb-1">
            <div 
              className="rounded"
              style={{ 
                width: '100%',
                height: '5px', 
                background: 'linear-gradient(to right, rgb(68,1,84), rgb(38,130,142), rgb(109,205,89), rgb(253,231,37))'
              }}
            ></div>
          </div>
          
          <div className="d-flex justify-content-between">
            <span className="badge bg-secondary-lt text-secondary" style={{ fontSize: '0.6rem', fontWeight: '500' }}>
              {showActivityGrid ? t('common.few') : '0'}
            </span>
            <span className="badge bg-warning-lt text-warning" style={{ fontSize: '0.6rem', fontWeight: '500' }}>
              {showActivityGrid ? t('common.many') : '20+'}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop: Full legend */}
      <div 
        className="d-none d-md-block card shadow-sm border-0"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          width: '200px',
          backgroundColor: 'rgba(var(--tblr-body-bg-rgb), 0.85)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="card-body p-2">
          {/* Compact Header */}
          <div className="d-flex align-items-center mb-2">
            {showActivityGrid ? (
              <IconMapPin size={16} className="text-primary me-1" />
            ) : (
              <IconSpeedboat size={16} className="text-primary me-1" />
            )}
            <h6 className="mb-0 fw-bold text-truncate">
              {showActivityGrid ? t('common.visitFrequency') : t('common.speed')}
            </h6>
          </div>
          
          {/* Compact Gradient Bar */}
          <div className="mb-2">
            <div 
              className="rounded"
              style={{ 
                height: '6px', 
                background: 'linear-gradient(to right, rgb(68,1,84), rgb(72,40,120), rgb(62,74,137), rgb(49,104,142), rgb(38,130,142), rgb(31,158,137), rgb(53,183,121), rgb(109,205,89), rgb(180,222,44), rgb(253,231,37))'
              }}
            ></div>
          </div>
          
          {/* Compact Value Labels */}
          <div className="d-flex justify-content-between small">
            <span className="text-muted">
              {showActivityGrid ? t('common.few') : "0"}
            </span>
            <span className="text-muted">
              {showActivityGrid ? t('common.many') : "20+"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapLegend; 