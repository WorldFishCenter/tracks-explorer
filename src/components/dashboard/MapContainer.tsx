import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FishersMap from '../Map';
import { TripPoint, LiveLocation } from '../../types';

interface MapContainerProps {
  loading: boolean;
  errorMessage: string | null;
  dataAvailable: boolean | null;
  dateFrom: Date;
  dateTo: Date;
  selectedTripId?: string;
  liveLocations: LiveLocation[];
  centerOnLiveLocations: boolean;
  onSelectVessel: (vessel: any) => void;
  onRetry: () => void;
  onTryWiderDateRange: () => void;
  renderNoImeiDataMessage: () => string;
  isViewingLiveLocations?: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({
  loading,
  errorMessage,
  dataAvailable,
  dateFrom,
  dateTo,
  selectedTripId,
  liveLocations,
  centerOnLiveLocations,
  onSelectVessel,
  onRetry,
  onTryWiderDateRange,
  renderNoImeiDataMessage,
  isViewingLiveLocations = false
}) => {
  const { t } = useTranslation();

  return (
    <Card className="mb-4 h-[500px]">
      <CardContent className="p-0 relative h-full">
        {/* Always render the map */}
        <FishersMap 
          onSelectVessel={onSelectVessel} 
          dateFrom={dateFrom}
          dateTo={dateTo}
          selectedTripId={selectedTripId}
          liveLocations={liveLocations}
          centerOnLiveLocations={centerOnLiveLocations}
        />
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-semibold">{t('common.loadingVesselData')}</p>
              <p className="text-sm text-muted-foreground">
                {t('common.pleaseWaitWhileWeRetrieve')}
              </p>
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {errorMessage && !loading && (
          <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
              <p className="text-lg font-semibold">{t('common.errorLoadingData')}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage}
              </p>
              <Button onClick={onRetry} className="h-11">
                {t('common.tryAgain')}
              </Button>
            </div>
          </div>
        )}
        
        {/* No data overlay - muted background */}
        {dataAvailable === false && !loading && !errorMessage && !isViewingLiveLocations && (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-white">{t('common.noVesselDataFound')}</p>
              <p className="text-sm text-gray-300 mb-4">
                {renderNoImeiDataMessage()}
              </p>
              <Button onClick={onTryWiderDateRange} className="h-11">
                {t('common.tryWiderDateRange')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapContainer; 