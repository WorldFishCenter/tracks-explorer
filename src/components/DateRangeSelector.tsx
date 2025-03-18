import React from 'react';
import { IconCalendar } from '@tabler/icons-react';
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
  return (
    <div>
      <div className="row g-2">
        <div className="col-12 mb-2">
          <label className="form-label text-muted small mb-1">From</label>
          <div className="input-icon">
            <span className="input-icon-addon">
              <IconCalendar size={16} />
            </span>
            <input
              type="date"
              className="form-control"
              value={format(dateFrom, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newDate = e.target.value 
                  ? new Date(e.target.value) 
                  : new Date();
                onDateChange(newDate, dateTo);
              }}
            />
          </div>
        </div>
        
        <div className="col-12">
          <label className="form-label text-muted small mb-1">To</label>
          <div className="input-icon">
            <span className="input-icon-addon">
              <IconCalendar size={16} />
            </span>
            <input
              type="date"
              className="form-control"
              value={format(dateTo, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newDate = e.target.value
                  ? new Date(e.target.value)
                  : new Date();
                onDateChange(dateFrom, newDate);
              }}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="btn-group w-100">
          <button 
            type="button" 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => {
              const now = new Date();
              const lastWeek = new Date();
              lastWeek.setDate(now.getDate() - 7);
              onDateChange(lastWeek, now);
            }}
          >
            Week
          </button>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => {
              const now = new Date();
              const lastMonth = new Date();
              lastMonth.setDate(now.getDate() - 30);
              onDateChange(lastMonth, now);
            }}
          >
            Month
          </button>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => {
              const now = new Date();
              const last3Months = new Date();
              last3Months.setDate(now.getDate() - 90);
              onDateChange(last3Months, now);
            }}
          >
            3 Months
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector; 