import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapLegendProps {
  showActivityGrid: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showActivityGrid }) => {
  const { t } = useTranslation();

  return (
    <Card 
      className="absolute bottom-2.5 right-2.5 w-48 opacity-90 z-10"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{showActivityGrid ? t('common.visitFrequency') : t('common.speed')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div 
          className="h-5 rounded-sm" 
          style={{ 
            background: 'linear-gradient(to right, rgb(68,1,84), rgb(72,40,120), rgb(62,74,137), rgb(49,104,142), rgb(38,130,142), rgb(31,158,137), rgb(53,183,121), rgb(109,205,89), rgb(180,222,44), rgb(253,231,37))' 
          }}
        />
        <div className="flex justify-between text-xs">
          <span>{showActivityGrid ? t('common.few') : "0 km/h"}</span>
          <span>{showActivityGrid ? t('common.many') : "20 km/h"}</span>
        </div>
        <p className="text-muted-foreground text-xs mt-1">
          {showActivityGrid 
            ? t('common.colorIndicatesFrequency')
            : t('common.colorIndicatesSpeed')}
        </p>
      </CardContent>
    </Card>
  );
};

export default MapLegend; 