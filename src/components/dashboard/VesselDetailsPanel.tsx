import React from 'react';
import { Anchor, Info, MapPin, Sailboat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LiveLocation, VesselDetails } from '../../types';
import { convertLiveLocationToVesselDetails } from '../../utils/calculations';
import { getBatteryBadgeClass } from '../../utils/colors';
import { formatCoordinates } from '../../utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface VesselDetailsPanelProps {
  liveLocations: LiveLocation[];
  onCenterOnLiveLocations: () => void;
}

const VesselDetailsPanel: React.FC<VesselDetailsPanelProps> = ({ liveLocations, onCenterOnLiveLocations }) => {
  const { t } = useTranslation();
  if (liveLocations.length === 0) {
    return (
      <Card className="max-h-[480px] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Anchor className="h-5 w-5 text-primary" />
              <span>{t('dashboard.vesselDetails')}</span>
            </CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={onCenterOnLiveLocations}
              title={t('dashboard.centerOnLiveLocations')}
            >
              <Sailboat className="mr-1 h-4 w-4" />
              {t('dashboard.liveLocation')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="mb-2 h-8 w-8 text-muted-foreground" />
            <div className="text-muted-foreground">{t('dashboard.noData')}</div>
            <div className="text-sm text-muted-foreground">{t('dashboard.noDataMessage')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-h-[480px] overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Anchor className="h-5 w-5 text-primary" />
            <span>{t('dashboard.vesselDetails')}</span>
          </CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCenterOnLiveLocations}
            title={t('dashboard.centerOnLiveLocations')}
          >
            <Sailboat className="mr-1 h-4 w-4" />
            {t('dashboard.liveLocation')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {liveLocations.map((location, index) => {
          const vesselDetails = convertLiveLocationToVesselDetails(location);
          
          return (
            <Card key={location.imei || index}>
              <CardContent className="p-4">
                {/* Vessel Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12 bg-orange-400">
                    <AvatarFallback className="bg-orange-400">
                      <Sailboat className="h-6 w-6 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{vesselDetails.name}</h4>
                    {vesselDetails.imei && (
                      <div className="text-sm text-muted-foreground font-mono">{vesselDetails.imei}</div>
                    )}
                  </div>
                  {vesselDetails.batteryState && (
                    <Badge variant="secondary">
                      {vesselDetails.batteryState}
                    </Badge>
                  )}
                </div>

                {/* Location & Status Info */}
                <div className="space-y-3">
                  {vesselDetails.coordinates && (
                    <div className="flex items-center space-x-3 py-2">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">{t('vessel.coordinates')}</div>
                        <div className="font-semibold font-mono">
                          {formatCoordinates(vesselDetails.coordinates.lat, vesselDetails.coordinates.lng)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                    {vesselDetails.lastGpsTime && (
                      <div>
                        <div className="text-sm text-muted-foreground">{t('vessel.lastGps')}</div>
                        <div className="font-semibold">{vesselDetails.lastGpsTime}</div>
                      </div>
                    )}
                    {vesselDetails.lastSeenTime && (
                      <div>
                        <div className="text-sm text-muted-foreground">{t('vessel.lastSeen')}</div>
                        <div className="font-semibold">{vesselDetails.lastSeenTime}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Update Footer */}
                <div className="mt-4 pt-3 border-t text-center">
                  <div className="text-sm text-muted-foreground">{t('vessel.lastUpdate')}</div>
                  <div className="font-semibold text-primary">{vesselDetails.lastUpdate}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default VesselDetailsPanel; 