import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconMapPin } from '@tabler/icons-react';
import { viridisColorRange } from '../../utils/colors';

interface MapLegendProps {
  showActivityGrid: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showActivityGrid }) => {
  const { t } = useTranslation();
  if (!showActivityGrid) return null;

  const buildGradient = (colors: number[][]) =>
    colors
      .map(color => {
        const [r, g, b, a] = [...color, 255].slice(0, 4);
        const alpha = (a / 255).toFixed(2);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      })
      .join(', ');
  const gradient = buildGradient(viridisColorRange);

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
            <IconMapPin size={14} className="text-primary me-1" />
            <span className="small fw-medium" style={{ fontSize: '0.75rem' }}>
              {t('common.visitFrequency')}
            </span>
          </div>
          
          <div className="mb-1">
            <div 
              className="rounded"
              style={{ 
                width: '100%',
                height: '5px', 
                background: `linear-gradient(to right, ${gradient})`
              }}
            ></div>
          </div>
          
          <div className="d-flex justify-content-between">
            <span className="badge bg-secondary-lt text-secondary" style={{ fontSize: '0.6rem', fontWeight: '500' }}>
              {t('common.few')}
            </span>
            <span className="badge bg-warning-lt text-warning" style={{ fontSize: '0.6rem', fontWeight: '500' }}>
              {t('common.many')}
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
            <IconMapPin size={16} className="text-primary me-1" />
            <h6 className="mb-0 fw-bold text-truncate">
              {t('common.visitFrequency')}
            </h6>
          </div>
          
          {/* Compact Gradient Bar */}
          <div className="mb-2">
            <div 
              className="rounded"
              style={{ 
                height: '6px', 
                background: `linear-gradient(to right, ${gradient})`
              }}
            ></div>
          </div>
          
          {/* Compact Value Labels */}
          <div className="d-flex justify-content-between small">
            <span className="text-muted">{t('common.few')}</span>
            <span className="text-muted">{t('common.many')}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapLegend; 
