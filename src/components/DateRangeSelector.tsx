import React, { useEffect } from 'react';
import { format } from 'date-fns';

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
  // Format date for display in input
  const formatInputDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  // Handle date input changes
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

  return (
    <div className="mb-1">
      <div className="mb-3">
        <label className="form-label">From</label>
        <div className="input-icon">
          <span className="input-icon-addon">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
              <path d="M11 15h1" />
              <path d="M12 15v3" />
            </svg>
          </span>
          <input 
            type="date" 
            className="form-control" 
            value={formatInputDate(dateFrom)}
            onChange={handleDateFromChange}
          />
        </div>
      </div>
      
      <div className="mb-3">
        <label className="form-label">To</label>
        <div className="input-icon">
          <span className="input-icon-addon">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
              <path d="M11 15h1" />
              <path d="M12 15v3" />
            </svg>
          </span>
          <input 
            type="date" 
            className="form-control" 
            value={formatInputDate(dateTo)}
            onChange={handleDateToChange}
          />
        </div>
      </div>
      
      <div className="btn-group w-100">
        <button 
          type="button" 
          className={`btn ${daysDiff === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={handleDay}
        >
          Day
        </button>
        <button 
          type="button" 
          className={`btn ${daysDiff === 7 ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={handleWeek}
        >
          Week
        </button>
        <button 
          type="button" 
          className={`btn ${daysDiff === 30 ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={handleMonth}
        >
          Month
        </button>
        <button 
          type="button" 
          className={`btn ${daysDiff === 90 ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={handleThreeMonths}
        >
          3 Months
        </button>
      </div>
    </div>
  );
};

export default DateRangeSelector; 