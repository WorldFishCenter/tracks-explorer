import React, { useState } from 'react';
import { IconChartLine, IconRoute, IconClock, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { VesselInsights } from '../../types';

interface VesselInsightsPanelProps {
  insights: VesselInsights;
  tripsCount: number;
}

const VesselInsightsPanel: React.FC<VesselInsightsPanelProps> = ({ insights, tripsCount }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const insightsContent = (
    <div className="list-group list-group-flush">
      <div className="list-group-item px-0 py-2">
        <div className="row align-items-center">
          <div className="col-auto">
            <span className="bg-primary text-white avatar avatar-sm">
              <IconRoute size={18} />
            </span>
          </div>
          <div className="col">
            <div className="fw-medium">
              {t('insights.totalTrips')}
            </div>
            <div className="text-muted small">
              {tripsCount} {t('common.total')} ({insights.activeTrips} {t('vessel.active')})
            </div>
          </div>
        </div>
      </div>
      
      <div className="list-group-item px-0 py-2">
        <div className="row align-items-center">
          <div className="col-auto">
            <span className="bg-green text-white avatar avatar-sm">
              <IconClock size={18} />
            </span>
          </div>
          <div className="col">
            <div className="fw-medium">
              {t('insights.averageSpeed')}
            </div>
            <div className="text-muted small">
              {insights.avgSpeed} km/h
            </div>
          </div>
        </div>
      </div>
      
      <div className="list-group-item px-0 py-2 border-0">
        <div className="row align-items-center">
          <div className="col-auto">
            <span className="bg-azure text-white avatar avatar-sm">
              <IconRoute size={18} />
            </span>
          </div>
          <div className="col">
            <div className="fw-medium">
              {t('insights.totalDistance')}
            </div>
            <div className="text-muted small">
              {insights.totalDistance} km
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card">
      {/* Mobile: Collapsible header */}
      <div 
        className={`card-header d-md-none ${isExpanded ? 'bg-primary-lt border-primary' : ''}`} 
        style={{ cursor: 'pointer' }} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="accordion-button" type="button">
          <IconChartLine className="icon me-2 text-primary" />
          <h3 className="card-title m-0">{t('dashboard.vesselInsights')}</h3>
          <div className="accordion-button-toggle">
            {isExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </div>
        </button>
      </div>

      {/* Desktop: Always visible content */}
      <div className="d-none d-md-block">
        <div className="card-body p-2">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center">
              <IconChartLine className="icon me-2 text-primary" />
              <h3 className="card-title m-0">{t('dashboard.vesselInsights')}</h3>
            </div>
          </div>
          {insightsContent}
        </div>
      </div>

      {/* Mobile: Collapsible content */}
      <div className={`collapse d-md-none ${isExpanded ? 'show' : ''}`} style={{ transition: 'height 0.35s ease' }}>
        <div className="card-body p-2">
          {insightsContent}
        </div>
      </div>
    </div>
  );
};

export default VesselInsightsPanel; 