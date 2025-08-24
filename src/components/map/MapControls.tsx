import React from 'react';
import { MapPin, Grid3X3, FilterX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface MapControlsProps {
  showActivityGrid: boolean;
  onToggleActivityGrid: (show: boolean) => void;
  selectedTripId?: string;
  onClearSelection?: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  showActivityGrid,
  onToggleActivityGrid,
  selectedTripId,
  onClearSelection
}) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-3 right-3 z-[100] flex flex-col gap-2">
      {/* Activity Grid Toggle */}
      <Card className="shadow-lg">
        <ToggleGroup
          type="single"
          value={showActivityGrid ? 'grid' : 'tracks'}
          onValueChange={(value) => {
            if (value === 'grid') onToggleActivityGrid(true);
            else if (value === 'tracks') onToggleActivityGrid(false);
          }}
          className="p-1"
        >
          <ToggleGroupItem
            value="tracks"
            aria-label={t('map.tripTracks')}
            className="flex items-center gap-2 px-3 py-2 h-11"
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden md:inline">{t('map.tripTracks')}</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="grid"
            aria-label={t('common.visitFrequency')}
            className="flex items-center gap-2 px-3 py-2 h-11"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden md:inline">{t('common.visitFrequency')}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </Card>

      {/* Reset filter button - only show when a trip is selected */}
      {selectedTripId && onClearSelection && (
        <Card className="shadow-lg">
          <Button
            variant="ghost"
            onClick={onClearSelection}
            title={t('common.showAllTrips')}
            aria-label={t('common.showAllTrips')}
            className="flex items-center gap-2 px-3 py-2 h-11 w-full justify-start"
          >
            <FilterX className="h-4 w-4" />
            <span className="hidden md:inline">{t('common.showAllTrips')}</span>
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MapControls; 