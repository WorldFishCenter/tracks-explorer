import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

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
    <div className="mb-1">
      <div className="mb-3">
        <label className="form-label">From</label>
        <div className="position-relative">
          <DatePicker
            selected={dateFrom}
            onChange={handleFromDateChange}
            selectsStart
            startDate={dateFrom}
            endDate={dateTo}
            className="form-control"
            dateFormat="MMM d, yyyy"
            showPopperArrow={false}
            calendarClassName="shadow-sm"
          />
          <div className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
              <path d="M11 15h1" />
              <path d="M12 15v3" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <label className="form-label">To</label>
        <div className="position-relative">
          <DatePicker
            selected={dateTo}
            onChange={handleToDateChange}
            selectsEnd
            startDate={dateFrom}
            endDate={dateTo}
            minDate={dateFrom}
            className="form-control"
            dateFormat="MMM d, yyyy"
            showPopperArrow={false}
            calendarClassName="shadow-sm"
          />
          <div className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
              <path d="M16 3v4" />
              <path d="M8 3v4" />
              <path d="M4 11h16" />
              <path d="M11 15h1" />
              <path d="M12 15v3" />
            </svg>
          </div>
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

      <style>
        {`
          /* Custom styles for react-datepicker */
          .react-datepicker-wrapper {
            width: 100%;
          }
          
          .react-datepicker__input-container {
            width: 100%;
          }
          
          .react-datepicker__input-container input {
            width: 100%;
            padding-left: 2rem;
          }
          
          .react-datepicker {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            border-radius: 0.5rem;
            border: 1px solid rgba(0,0,0,0.1);
          }
          
          .react-datepicker__header {
            background-color: rgba(51, 102, 153, 0.05);
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
          
          .react-datepicker__current-month {
            font-weight: 600;
          }
          
          .react-datepicker__day--selected {
            background-color: #0d6efd;
            border-radius: 0.25rem;
          }
          
          .react-datepicker__day--in-selecting-range,
          .react-datepicker__day--in-range {
            background-color: rgba(13, 110, 253, 0.2);
            color: #000;
          }
        `}
      </style>
    </div>
  );
};

export default DateRangeSelector; 