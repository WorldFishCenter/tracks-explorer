import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFisherPerformance } from '../../hooks/useFisherPerformance';
import { IconTrendingUp, IconTrendingDown, IconGauge, IconDroplet, IconTrophy } from '@tabler/icons-react';
import { format } from 'date-fns';

interface EfficiencyTabProps {
  dateFrom: Date;
  dateTo: Date;
  compareWith: 'community' | 'previous';
}

const EfficiencyTab: React.FC<EfficiencyTabProps> = ({ dateFrom, dateTo, compareWith }) => {
  const { t } = useTranslation();
  const { performance, loading, error } = useFisherPerformance(dateFrom, dateTo, compareWith);

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

  if (!performance) {
    return (
      <div className="alert alert-info" role="alert">
        <h4 className="alert-title">{t('stats.noData')}</h4>
        <div className="text-secondary">{t('stats.tryDifferentPeriod')}</div>
      </div>
    );
  }

  const { metrics, tripTypes, bestTrips, comparison } = performance;

  // Check if user has any actual performance data (not just zeros)
  const hasPerformanceData = bestTrips.length > 0 &&
    Object.values(tripTypes).some((data) => data && data.count > 0);

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

  if (!hasPerformanceData) {
    return (
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-title">{t('stats.performance.noData')}</h4>
        <div className="text-secondary">
          {t('stats.performance.noDataMessage')}
        </div>
      </div>
    );
  }

  // Calculate total trips safely
  const totalTrips = Object.values(tripTypes).reduce((sum, data) =>
    sum + (data?.count || 0), 0
  );

  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    description: string,
    yourAvg: number,
    comparisonAvg: number,
    percentDiff: number,
    lowerIsBetter: boolean = false
  ) => {
    const isGood = lowerIsBetter ? percentDiff < 0 : percentDiff > 0;
    const isBad = lowerIsBetter ? percentDiff > 0 : percentDiff < 0;

    return (
      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              {icon}
              <div className="ms-2">
                <div className="fw-bold">{title}</div>
                <div className="text-muted small">{description}</div>
              </div>
            </div>
            <div className="h2 mb-2">{yourAvg.toFixed(2)}</div>
            {comparison.basedOn && comparison.basedOn.length > 0 && comparison.basedOn !== '0' && comparison.hasData !== false ? (
              <div className="d-flex align-items-center">
                {isGood ? (
                  <>
                    <IconTrendingUp size={16} className="text-success me-1" />
                    <span className="text-success small">
                      +{Math.abs(percentDiff)}% vs {getComparisonLabel()}
                    </span>
                  </>
                ) : isBad ? (
                  <>
                    <IconTrendingDown size={16} className="text-danger me-1" />
                    <span className="text-danger small">
                      {Math.abs(percentDiff)}% vs {getComparisonLabel()}
                    </span>
                  </>
                ) : (
                  <span className="text-muted small">{t('stats.comparison.same')}</span>
                )}
              </div>
            ) : comparison.basedOn && comparison.basedOn.length > 0 ? (
              <div className="text-muted small">{getNoDataMessage()}</div>
            ) : (
              <div className="text-muted small">{t('stats.noComparisonData')}</div>
            )}
            {comparison.basedOn && comparison.basedOn.length > 0 && (
              <div className="text-muted small mt-2">
                {t('stats.comparison.yourAvg')}: {yourAvg.toFixed(2)} | {t('stats.comparison.comparison', { type: comparison.type })}: {comparisonAvg.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="row g-3">
      {/* Performance Metrics */}
      <div className="col-12">
        <h4 className="mb-3">{t('stats.performance.title')}</h4>
        <div className="row g-3">
          {renderMetricCard(
            <IconGauge size={24} className="text-primary" />,
            t('stats.performance.cpue'),
            t('stats.performance.cpueDesc'),
            metrics.cpue_kg_per_hour.yourAvg,
            metrics.cpue_kg_per_hour.comparisonAvg,
            metrics.cpue_kg_per_hour.percentDiff
          )}
          {renderMetricCard(
            <IconDroplet size={24} className="text-info" />,
            t('stats.performance.fuelEfficiency'),
            t('stats.performance.fuelDesc'),
            metrics.kg_per_liter.yourAvg,
            metrics.kg_per_liter.comparisonAvg,
            metrics.kg_per_liter.percentDiff
          )}
        </div>
      </div>

      {/* Trip Types */}
      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('stats.performance.tripTypes')}</h3>
          </div>
          <div className="card-body">
            {Object.entries(tripTypes).map(([type, data]) => {
              if (!data || data.count === 0) return null;

              const typeLabel = type === 'mid-range'
                ? t('stats.performance.midRange')
                : t(`stats.performance.${type}`);

              const percentage = totalTrips > 0 ? (data.count / totalTrips) * 100 : 0;

              return (
                <div key={type} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-capitalize">{typeLabel}</span>
                    <span className="fw-bold">{data.count} {t('stats.summary.trips')}</span>
                  </div>
                  <div className="progress" style={{ height: '20px' }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${percentage}%` }}
                      aria-valuenow={data.count}
                      aria-valuemin={0}
                      aria-valuemax={totalTrips}
                    >
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-muted small mt-1">
                    {data.avgCatch > 0
                      ? `${t('stats.summary.avgCatch')}: ${data.avgCatch.toFixed(1)} ${t('stats.summary.kg')}`
                      : t('stats.noCatchesYet')
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Best Trips */}
      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <IconTrophy className="me-2" size={20} />
              {t('stats.performance.bestTrips')}
            </h3>
          </div>
          <div className="card-body">
            {bestTrips.length > 0 ? (
              <div className="list-group list-group-flush">
                {bestTrips.filter(trip => trip.cpue > 0).map((trip, index) => (
                  <div key={index} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small">
                          {format(new Date(trip.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-capitalize small">{trip.tripType}</div>
                      </div>
                      <div className="text-end">
                        <div className="badge bg-success-lt fs-3">
                          {trip.cpue.toFixed(1)} {t('stats.performance.cpueDesc')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">{t('stats.performance.noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Info */}
      {comparison.basedOn && comparison.basedOn.length > 0 && comparison.basedOn !== '0' ? (
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

export default EfficiencyTab;
