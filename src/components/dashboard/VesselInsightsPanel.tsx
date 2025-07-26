import React from 'react';
import { IconChartLine, IconRoute, IconClock } from '@tabler/icons-react';
import { VesselInsights } from '../../types';

interface VesselInsightsPanelProps {
  insights: VesselInsights;
  tripsCount: number;
}

const VesselInsightsPanel: React.FC<VesselInsightsPanelProps> = ({ insights, tripsCount }) => {
  return (
    <div className="card">
      <div className="card-body p-2">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <IconChartLine className="icon me-2 text-primary" />
            <h3 className="card-title m-0">Vessel Insights</h3>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="card card-sm">
            <div className="card-body py-1">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-primary text-white avatar avatar-sm">
                    <IconRoute size={18} />
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">
                    Trips
                  </div>
                  <div className="text-muted">
                    {tripsCount} total ({insights.activeTrips} active)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card card-sm">
            <div className="card-body py-1">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-green text-white avatar avatar-sm">
                    <IconClock size={18} />
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">
                    Average Speed
                  </div>
                  <div className="text-muted">
                    {insights.avgSpeed} km/h
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card card-sm">
            <div className="card-body py-1">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-azure text-white avatar avatar-sm">
                    <IconRoute size={18} />
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">
                    Total Distance
                  </div>
                  <div className="text-muted">
                    {insights.totalDistance} km
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselInsightsPanel; 