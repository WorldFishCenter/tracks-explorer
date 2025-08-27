import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import "react-datepicker/dist/react-datepicker.css";
import "./date-range-selector.css";

interface DateRangeSelectorProps {
  dateFrom: Date;
  dateTo: Date;
  onDateChange: (dateFrom: Date, dateTo: Date) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateFrom,
  dateTo,
  onDateChange
}) => {
  const { t } = useTranslation();
  // Calculate days difference for determining active preset
  const getDaysDifference = (): number => {
    return Math.round((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  // Preset date range helpers
  const handleDay = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    onDateChange(yesterday, today);
  };
  
  const handleWeek = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    onDateChange(weekAgo, today);
  };
  
  const handleMonth = () => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);
    onDateChange(monthAgo, today);
  };
  
  const handleThreeMonths = () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    onDateChange(threeMonthsAgo, today);
  };
  
  // Set week as default on first render
  useEffect(() => {
    handleWeek();
    // Only run on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get days difference for active state
  const daysDiff = getDaysDifference();

  // Handle date changes with null check
  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      onDateChange(date, dateTo);
    }
  };

  const handleToDateChange = (date: Date | null) => {
    if (date) {
      onDateChange(dateFrom, date);
    }
  };

  return (
    <div className="mb-1 date-range-selector">      
      <div className="d-grid gap-1 mb-3">
        <div className="row g-1">
          <div className="col-6">
            <button 
              type="button" 
              className={`btn w-100 ${daysDiff === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleDay}
              style={{ minHeight: '36px' }}
            >
              {t('dateRange.presets.today')}
            </button>
          </div>
          <div className="col-6">
            <button 
              type="button" 
              className={`btn w-100 ${daysDiff === 7 ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleWeek}
              style={{ minHeight: '36px' }}
            >
              {t('dateRange.presets.last7Days')}
            </button>
          </div>
        </div>
        <div className="row g-1">
          <div className="col-6">
            <button 
              type="button" 
              className={`btn w-100 ${daysDiff === 30 ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleMonth}
              style={{ minHeight: '36px' }}
            >
              {t('dateRange.presets.last30Days')}
            </button>
          </div>
          <div className="col-6">
            <button 
              type="button" 
              className={`btn w-100 ${daysDiff === 90 ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleThreeMonths}
              style={{ minHeight: '36px' }}
            >
              {t('dateRange.presets.last90Days')}
            </button>
          </div>
        </div>
      </div>
      <div className="row g-2 mb-2">
        <div className="col-6">
          <label className="form-label mb-1 small">{t('dateRange.from')}</label>
          <DatePicker
            selected={dateFrom}
            onChange={handleFromDateChange}
            selectsStart
            startDate={dateFrom}
            endDate={dateTo}
            className="form-control"
            dateFormat="MMM d"
            showPopperArrow={false}
            calendarClassName="shadow-sm"
            popperClassName="date-picker-popper"
            placeholderText="From date"
          />
        </div>
        <div className="col-6">
          <label className="form-label mb-1 small">{t('dateRange.to')}</label>
          <DatePicker
            selected={dateTo}
            onChange={handleToDateChange}
            selectsEnd
            startDate={dateFrom}
            endDate={dateTo}
            minDate={dateFrom}
            className="form-control"
            dateFormat="MMM d"
            showPopperArrow={false}
            calendarClassName="shadow-sm"
            popperClassName="date-picker-popper"
            placeholderText="To date"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector; 