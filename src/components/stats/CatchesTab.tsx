import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useFisherStats } from '../../hooks/useFisherStats';
import { IconFish, IconTrendingUp, IconTrendingDown, IconChartLine } from '@tabler/icons-react';

const CatchTrendChart = lazy(() => import('./CatchTrendChart'));

interface CatchesTabProps {
  dateFrom: Date;
  dateTo: Date;
  compareWith: 'community' | 'previous';
}

const CatchesTab: React.FC<CatchesTabProps> = ({ dateFrom, dateTo, compareWith }) => {
  const { t } = useTranslation();
  const { stats, loading, error } = useFisherStats(dateFrom, dateTo, compareWith);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('stats.loading')}</span>
        </div>
        <p className="mt-3 text-muted">{t('stats.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-title">{t('stats.error')}</h4>
        <div className="text-secondary">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="alert alert-info" role="alert">
        <h4 className="alert-title">{t('stats.noData')}</h4>
        <div className="text-secondary">{t('stats.tryDifferentPeriod')}</div>
      </div>
    );
  }

  const { summary, catchByType, timeSeries, comparison } = stats;

  // Check for truly empty data (no trips at all)
  const hasNoTrips = summary.totalTrips === 0;

  if (hasNoTrips) {
    return (
      <div className="alert alert-info" role="alert">
        <h4 className="alert-title">{t('stats.noTripsYet')}</h4>
        <div className="text-secondary">{t('stats.keepFishing')}</div>
      </div>
    );
  }

  // Calculate percent difference for display
  const successRateDiff = summary.successRate - comparison.avgSuccessRate;
  const catchDiff = summary.avgCatchPerTrip - comparison.avgCatch;

  // Check if comparison data is meaningful (not just zeros)
  const hasComparisonData = comparison.basedOn && comparison.basedOn.length > 0;

  // Get comparison label for inline display
  const getComparisonLabel = () => {
    if (comparison.type === 'community') {
      return t('stats.comparison.community');
    }
    // For previous period, use the date range from basedOn
    return comparison.basedOn || t('stats.comparison.lastPeriod');
  };

  // Get message when no comparison data is available
  const getNoDataMessage = () => {
    if (comparison.type === 'community') {
      return t('stats.comparison.noCommunityData');
    }
    // For previous period, show the date range with "No data"
    return `${t('stats.comparison.noDataIn')} ${comparison.basedOn}`;
  };

  return (
    <div className="row g-3">
      {/* Summary Cards - Reordered: Total Catch, Avg Catch per Trip, Success Rate, Total Trips */}
      <div className="col-12">
        <div className="row g-2">
          {/* 1. Total Catch */}
          <div className="col-6 col-md-3">
            <div className="card card-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="text-muted small">{t('stats.summary.totalCatch')}</div>
                <div className="h2 mb-0">{summary.totalCatch.toFixed(1)}</div>
                <div className="text-muted small mt-auto">{t('stats.summary.kg')}</div>
              </div>
            </div>
          </div>
          {/* 2. Avg Catch per Trip */}
          <div className="col-6 col-md-3">
            <div className="card card-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="text-muted small">{t('stats.summary.avgCatch')}</div>
                <div className="h2 mb-0">{summary.avgCatchPerTrip.toFixed(1)}</div>
                {hasComparisonData && comparison.hasData !== false ? (
                  <div className="d-flex align-items-center mt-auto">
                    {catchDiff > 0 ? (
                      <>
                        <IconTrendingUp size={16} className="text-success me-1" />
                        <span className="text-success small">
                          +{catchDiff.toFixed(1)} {t('stats.catchByType.kg')} {t('stats.comparison.vs')} {getComparisonLabel()}
                        </span>
                      </>
                    ) : catchDiff < 0 ? (
                      <>
                        <IconTrendingDown size={16} className="text-danger me-1" />
                        <span className="text-danger small">
                          {catchDiff.toFixed(1)} {t('stats.catchByType.kg')} {t('stats.comparison.vs')} {getComparisonLabel()}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted small">{t('stats.comparison.same')}</span>
                    )}
                  </div>
                ) : hasComparisonData ? (
                  <div className="text-muted small mt-auto">{getNoDataMessage()}</div>
                ) : (
                  <div className="text-muted small mt-auto">&nbsp;</div>
                )}
              </div>
            </div>
          </div>
          {/* 3. Success Rate */}
          <div className="col-6 col-md-3">
            <div className="card card-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="text-muted small">{t('stats.summary.successRate')}</div>
                <div className="h2 mb-0">{(summary.successRate * 100).toFixed(0)}%</div>
                {hasComparisonData && comparison.hasData !== false ? (
                  <div className="d-flex align-items-center mt-auto">
                    {successRateDiff > 0 ? (
                      <>
                        <IconTrendingUp size={16} className="text-success me-1" />
                        <span className="text-success small">
                          +{(successRateDiff * 100).toFixed(0)}% {t('stats.comparison.vs')} {getComparisonLabel()}
                        </span>
                      </>
                    ) : successRateDiff < 0 ? (
                      <>
                        <IconTrendingDown size={16} className="text-danger me-1" />
                        <span className="text-danger small">
                          {(successRateDiff * 100).toFixed(0)}% {t('stats.comparison.vs')} {getComparisonLabel()}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted small">{t('stats.comparison.same')}</span>
                    )}
                  </div>
                ) : hasComparisonData ? (
                  <div className="text-muted small mt-auto">{getNoDataMessage()}</div>
                ) : (
                  <div className="text-muted small mt-auto">&nbsp;</div>
                )}
              </div>
            </div>
          </div>
          {/* 4. Total Trips */}
          <div className="col-6 col-md-3">
            <div className="card card-sm h-100">
              <div className="card-body d-flex flex-column">
                <div className="text-muted small">{t('stats.summary.totalTrips')}</div>
                <div className="h2 mb-0">{summary.totalTrips}</div>
                <div className="text-muted small mt-auto">{t('stats.summary.trips')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catch by Type */}
      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <IconFish className="me-2" size={20} />
              {t('stats.catchByType.title')}
            </h3>
          </div>
          <div className="card-body">
            {catchByType.length > 0 ? (
              <div className="space-y-2">
                {catchByType.map((item, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{t(`catches.fishGroups.${item.fishGroup.toLowerCase().replace(/\s+/g, '').replace(/\//g, '')}`)}</span>
                      <span className="fw-bold">{item.totalKg.toFixed(1)} {t('stats.catchByType.kg')}</span>
                    </div>
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${(item.totalKg / summary.totalCatch) * 100}%` }}
                        aria-valuenow={(item.totalKg / summary.totalCatch) * 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        {((item.totalKg / summary.totalCatch) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-muted small mt-1">
                      {item.count} {t('stats.catchByType.catches')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">{t('stats.catchByType.noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Catch Trend Chart */}
      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <IconChartLine className="me-2" size={20} />
              {t('stats.chart.title')}
            </h3>
          </div>
          <div className="card-body">
            <Suspense
              fallback={
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                  </div>
                </div>
              }
            >
              <CatchTrendChart
                data={timeSeries}
                comparisonAvg={hasComparisonData && comparison.hasData !== false ? comparison.avgCatch : undefined}
                comparisonType={hasComparisonData ? comparison.type : undefined}
                comparisonLabel={hasComparisonData ? (comparison.type === 'community' ? undefined : comparison.basedOn) : undefined}
                comparisonHasData={hasComparisonData ? comparison.hasData : undefined}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Comparison Info */}
      {hasComparisonData && comparison.basedOn !== '0' && comparison.basedOn !== '' ? (
        <div className="col-12">
          <div className={`alert ${comparison.hasData === false ? 'alert-warning' : 'alert-info'} mb-0`}>
            <div className="d-flex align-items-center">
              <div>
                <strong>{comparison.type === 'community' ? t('stats.comparison.comparedTo') : t('stats.comparison.comparedToPrevious')}:</strong> {comparison.basedOn}
                {comparison.hasData === false && ` - ${t('stats.comparison.noData')}`}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CatchesTab;
