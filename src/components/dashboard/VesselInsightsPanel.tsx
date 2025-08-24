import React from 'react';
import { BarChart3, Route, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VesselInsights } from '../../types';

interface VesselInsightsPanelProps {
  insights: VesselInsights;
  tripsCount: number;
}

const VesselInsightsPanel: React.FC<VesselInsightsPanelProps> = ({ insights, tripsCount }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-base">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>{t('dashboard.vesselInsights')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Trips */}
        <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Route size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">
              {t('insights.totalTrips')}
            </div>
            <div className="text-sm text-muted-foreground">
              {tripsCount} {t('common.total')} 
              {insights.activeTrips > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {insights.activeTrips} {t('vessel.active')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Average Speed */}
        <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-500 text-white">
              <Clock size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">
              {t('insights.averageSpeed')}
            </div>
            <div className="text-sm text-muted-foreground">
              {insights.avgSpeed} km/h
            </div>
          </div>
        </div>
        
        {/* Total Distance */}
        <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-500 text-white">
              <Route size={16} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium text-sm">
              {t('insights.totalDistance')}
            </div>
            <div className="text-sm text-muted-foreground">
              {insights.totalDistance} km
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VesselInsightsPanel; 