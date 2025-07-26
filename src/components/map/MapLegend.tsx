import React from 'react';
import { useTranslation } from 'react-i18next';

interface MapLegendProps {
  showActivityGrid: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showActivityGrid }) => {
  const { t } = useTranslation();

  return (
    <div 
      className="card"
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 1,
        width: '200px',
        opacity: 0.9
      }}
    >
      <div className="card-body p-2">
        <h3 className="card-title mb-2">{showActivityGrid ? t('common.visitFrequency') : t('common.speed')}</h3>
        <div className="mb-2" style={{ 
          height: '20px', 
          background: 'linear-gradient(to right, rgb(68,1,84), rgb(72,40,120), rgb(62,74,137), rgb(49,104,142), rgb(38,130,142), rgb(31,158,137), rgb(53,183,121), rgb(109,205,89), rgb(180,222,44), rgb(253,231,37))' 
        }}></div>
        <div className="d-flex justify-content-between">
          <span>{showActivityGrid ? t('common.few') : "0 km/h"}</span>
          <span>{showActivityGrid ? t('common.many') : "20 km/h"}</span>
        </div>
        <div className="text-muted small mt-1">
          {showActivityGrid 
            ? t('common.colorIndicatesFrequency')
            : t('common.colorIndicatesSpeed')}
        </div>
      </div>
    </div>
  );
};

export default MapLegend; 