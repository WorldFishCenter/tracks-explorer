import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';
import { subDays, differenceInDays } from 'date-fns';
import { IconChartBar, IconGauge } from '@tabler/icons-react';
import CatchesTab from '../components/stats/CatchesTab';
import EfficiencyTab from '../components/stats/EfficiencyTab';
import StatsControls from '../components/stats/StatsControls';
import { formatDisplayDate } from '../utils/formatters';

const Stats: React.FC = () => {
  const { t } = useTranslation();

  // Active tab: 'catches' or 'efficiency'
  const [activeTab, setActiveTab] = useState<'catches' | 'efficiency'>('catches');

  // Date range state (default: last 30 days)
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  // Comparison toggle state
  const [compareWith, setCompareWith] = useState<'community' | 'previous'>('community');

  const handleDateChange = (from: Date, to: Date) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleCompareChange = (comparison: 'community' | 'previous') => {
    setCompareWith(comparison);
  };

  // Create the page header
  const pageHeader = (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <div className="page-pretitle text-secondary fs-sm">
          {t('dashboard.dateRange', {
            from: formatDisplayDate(dateFrom),
            to: formatDisplayDate(dateTo),
            days: differenceInDays(dateTo, dateFrom) + 1
          })}
        </div>
        <h2 className="page-title mb-0 mt-0">{t('stats.title')}</h2>
      </div>
    </div>
  );

  return (
    <MainLayout pageHeader={pageHeader}>
      {/* Stats Controls (Date Range & Comparison) */}
      <StatsControls
        dateFrom={dateFrom}
        dateTo={dateTo}
        compareWith={compareWith}
        onDateChange={handleDateChange}
        onCompareChange={handleCompareChange}
      />

      {/* Tabs Navigation */}
      <div className="card mb-3">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'catches' ? 'active' : ''}`}
                onClick={() => setActiveTab('catches')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'catches'}
              >
                <IconChartBar className="me-2" size={20} />
                {t('stats.myCatches')}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'efficiency' ? 'active' : ''}`}
                onClick={() => setActiveTab('efficiency')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'efficiency'}
              >
                <IconGauge className="me-2" size={20} />
                {t('stats.myEfficiency')}
              </button>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="card-body">
          {activeTab === 'catches' && (
            <CatchesTab
              dateFrom={dateFrom}
              dateTo={dateTo}
              compareWith={compareWith}
            />
          )}
          {activeTab === 'efficiency' && (
            <EfficiencyTab
              dateFrom={dateFrom}
              dateTo={dateTo}
              compareWith={compareWith}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Stats;
