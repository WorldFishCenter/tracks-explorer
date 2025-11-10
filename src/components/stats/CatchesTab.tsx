import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFisherStats } from '../../hooks/useFisherStats';
import { IconFish, IconTrendingUp, IconTrendingDown, IconCalendar } from '@tabler/icons-react';
import { format } from 'date-fns';

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

  const { summary, catchByType, recentTrips, comparison } = stats;

  // Calculate percent difference for display
  const successRateDiff = summary.successRate - comparison.avgSuccessRate;
  const catchDiff = summary.avgCatchPerTrip - comparison.avgCatch;

  return (
    <div className="row g-3">
      {/* Summary Cards */}
      <div className="col-12">
        <div className="row g-2">
          <div className="col-6 col-md-3">
            <div className="card card-sm">
              <div className="card-body">
                <div className="text-muted small">{t('stats.summary.totalCatch')}</div>
                <div className="h2 mb-0">{summary.totalCatch.toFixed(1)}</div>
                <div className="text-muted small">{t('stats.summary.kg')}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card card-sm">
              <div className="card-body">
                <div className="text-muted small">{t('stats.summary.totalTrips')}</div>
                <div className="h2 mb-0">{summary.totalTrips}</div>
                <div className="text-muted small">{t('stats.summary.trips')}</div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card card-sm">
              <div className="card-body">
                <div className="text-muted small">{t('stats.summary.successRate')}</div>
                <div className="h2 mb-0">{(summary.successRate * 100).toFixed(0)}%</div>
                <div className="d-flex align-items-center">
                  {successRateDiff > 0 ? (
                    <>
                      <IconTrendingUp size={16} className="text-success me-1" />
                      <span className="text-success small">
                        {(successRateDiff * 100).toFixed(0)}% {t('stats.comparison.better')}
                      </span>
                    </>
                  ) : successRateDiff < 0 ? (
                    <>
                      <IconTrendingDown size={16} className="text-danger me-1" />
                      <span className="text-danger small">
                        {Math.abs(successRateDiff * 100).toFixed(0)}% {t('stats.comparison.worse')}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted small">Average</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card card-sm">
              <div className="card-body">
                <div className="text-muted small">{t('stats.summary.avgCatch')}</div>
                <div className="h2 mb-0">{summary.avgCatchPerTrip.toFixed(1)}</div>
                <div className="d-flex align-items-center">
                  {catchDiff > 0 ? (
                    <>
                      <IconTrendingUp size={16} className="text-success me-1" />
                      <span className="text-success small">
                        {catchDiff.toFixed(1)} {t('stats.summary.kg')} {t('stats.comparison.better')}
                      </span>
                    </>
                  ) : catchDiff < 0 ? (
                    <>
                      <IconTrendingDown size={16} className="text-danger me-1" />
                      <span className="text-danger small">
                        {Math.abs(catchDiff).toFixed(1)} {t('stats.summary.kg')} {t('stats.comparison.worse')}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted small">Average</span>
                  )}
                </div>
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
                      <span className="text-capitalize">{item.fishGroup}</span>
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

      {/* Recent Trips */}
      <div className="col-12 col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <IconCalendar className="me-2" size={20} />
              {t('stats.recentTrips.title')}
            </h3>
          </div>
          <div className="card-body">
            {recentTrips.length > 0 ? (
              <div className="list-group list-group-flush">
                {recentTrips.map((trip, index) => (
                  <div key={index} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-muted small">
                          {format(new Date(trip.date), 'MMM dd, yyyy')}
                        </div>
                        {trip.fishGroup && (
                          <div className="text-capitalize small">{trip.fishGroup}</div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className={`fw-bold ${trip.catch_kg > 0 ? 'text-success' : 'text-muted'}`}>
                          {trip.catch_kg.toFixed(1)} {t('stats.summary.kg')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">{t('stats.recentTrips.noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Info */}
      <div className="col-12">
        <div className="alert alert-info mb-0">
          <div className="d-flex align-items-center">
            <div>
              <strong>{t('stats.comparison.title')}:</strong> {comparison.basedOn}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatchesTab;
