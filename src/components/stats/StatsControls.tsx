import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { subDays, differenceInDays } from 'date-fns';
import { IconCalendar } from '@tabler/icons-react';

interface StatsControlsProps {
  dateFrom: Date;
  dateTo: Date;
  compareWith: 'community' | 'previous';
  onDateChange: (from: Date, to: Date) => void;
  onCompareChange: (comparison: 'community' | 'previous') => void;
}

const StatsControls: React.FC<StatsControlsProps> = ({
  dateFrom,
  dateTo,
  compareWith,
  onDateChange,
  onCompareChange
}) => {
  const { t } = useTranslation();
  const [activePreset, setActivePreset] = useState<string>('last30Days');

  // Detect which preset is active based on date range
  useEffect(() => {
    const now = new Date();
    const daysDiff = differenceInDays(now, dateFrom);

    if (daysDiff === 7) {
      setActivePreset('last7Days');
    } else if (daysDiff === 30) {
      setActivePreset('last30Days');
    } else if (daysDiff === 90) {
      setActivePreset('last90Days');
    } else {
      setActivePreset('custom');
    }
  }, [dateFrom, dateTo]);

  const handlePresetChange = (preset: string) => {
    const now = new Date();
    let from: Date;

    switch (preset) {
      case 'last7Days':
        from = subDays(now, 7);
        break;
      case 'last30Days':
        from = subDays(now, 30);
        break;
      case 'last90Days':
        from = subDays(now, 90);
        break;
      default:
        return;
    }

    setActivePreset(preset);
    onDateChange(from, now);
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate, dateTo);
    }
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(dateFrom, newDate);
    }
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          {/* Date Range Selection */}
          <div className="col-12 col-md-6">
            <label className="form-label">
              <IconCalendar className="me-2" size={18} />
              {t('stats.dateRange')}
            </label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(dateFrom)}
                  onChange={handleDateFromChange}
                  max={formatDateForInput(dateTo)}
                />
              </div>
              <div className="col-6">
                <input
                  type="date"
                  className="form-control"
                  value={formatDateForInput(dateTo)}
                  onChange={handleDateToChange}
                  min={formatDateForInput(dateFrom)}
                  max={formatDateForInput(new Date())}
                />
              </div>
            </div>
            {/* Quick presets */}
            <div className="btn-group mt-2 w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${activePreset === 'last7Days' ? 'btn-primary' : ''}`}
                onClick={() => handlePresetChange('last7Days')}
              >
                {t('stats.last7Days')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activePreset === 'last30Days' ? 'btn-primary' : ''}`}
                onClick={() => handlePresetChange('last30Days')}
              >
                {t('stats.last30Days')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activePreset === 'last90Days' ? 'btn-primary' : ''}`}
                onClick={() => handlePresetChange('last90Days')}
              >
                {t('stats.last90Days')}
              </button>
            </div>
          </div>

          {/* Comparison Toggle */}
          <div className="col-12 col-md-6">
            <label className="form-label">{t('stats.compareWith')}</label>
            <div className="btn-group w-100" role="group">
              <input
                type="radio"
                className="btn-check"
                name="compareWith"
                id="compare-community"
                checked={compareWith === 'community'}
                onChange={() => onCompareChange('community')}
              />
              <label className="btn btn-outline-primary" htmlFor="compare-community">
                {t('stats.community')}
              </label>

              <input
                type="radio"
                className="btn-check"
                name="compareWith"
                id="compare-previous"
                checked={compareWith === 'previous'}
                onChange={() => onCompareChange('previous')}
              />
              <label className="btn btn-outline-primary" htmlFor="compare-previous">
                {t('stats.previousPeriod')}
              </label>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsControls;
