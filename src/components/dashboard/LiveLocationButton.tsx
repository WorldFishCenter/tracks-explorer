import React from 'react';
import { Sailboat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LiveLocation } from '../../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LiveLocationButtonProps {
  liveLocations: LiveLocation[];
  onCenterOnLiveLocations: () => void;
}

const LiveLocationButton: React.FC<LiveLocationButtonProps> = ({ 
  liveLocations, 
  onCenterOnLiveLocations 
}) => {
  const { t } = useTranslation();
  return (
    <Card className="mb-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base">
          <Sailboat className="h-4 w-4 mr-2 text-primary" />
          {t('dashboard.liveLocation')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <Button
          variant="destructive"
          className="w-full h-11"
          onClick={onCenterOnLiveLocations}
        >
          <Sailboat className="h-4 w-4 mr-2" />
          Last Location ({liveLocations.length})
        </Button>
        <p className="text-muted-foreground text-sm">
          {liveLocations.length > 0 
            ? t('dashboard.centerOnLiveLocations')
            : t('dashboard.noData')
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default LiveLocationButton; 