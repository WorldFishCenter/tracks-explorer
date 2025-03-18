import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IconCalendar, IconCheck } from '@tabler/icons-react';
import { format, subDays } from 'date-fns';
import './date-range-selector.css'; // We'll create this file next

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
  // State for showing/hiding date pickers
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  
  // Local state for dates (to avoid triggering API calls immediately)
  const [localDateFrom, setLocalDateFrom] = useState<Date>(dateFrom);
  const [localDateTo, setLocalDateTo] = useState<Date>(dateTo);
  
  // Check if dates have changed and need to be applied
  const datesChanged = 
    localDateFrom.getTime() !== dateFrom.getTime() || 
    localDateTo.getTime() !== dateTo.getTime();
  
  // Refs for click-outside detection
  const fromPickerRef = useRef<HTMLDivElement>(null);
  const toPickerRef = useRef<HTMLDivElement>(null);

  // Format date for display in input
  const formatDisplayDate = (date: Date): string => {
    return format(date, 'dd MMM yyyy');
  };
  
  // Handle clicks outside of the date pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close "from" date picker if clicked outside
      if (fromPickerRef.current && 
          !fromPickerRef.current.contains(event.target as Node) &&
          showFromPicker) {
        setShowFromPicker(false);
      }
      
      // Close "to" date picker if clicked outside
      if (toPickerRef.current && 
          !toPickerRef.current.contains(event.target as Node) &&
          showToPicker) {
        setShowToPicker(false);
      }
    };
    
    // Add event listener when pickers are open
    if (showFromPicker || showToPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFromPicker, showToPicker]);
  
  // Apply date changes and trigger the parent callback
  const applyDateChanges = () => {
    onDateChange(localDateFrom, localDateTo);
  };
  
  // Apply changes when preset buttons are clicked
  const handlePresetDateRange = (daysBack: number) => {
    const now = new Date();
    const previous = subDays(now, daysBack);
    setLocalDateFrom(previous);
    setLocalDateTo(now);
    // For presets, we apply immediately
    onDateChange(previous, now);
  };

  return (
    <div className="date-range-selector">
      <div className="row g-2">
        <div className="col-12 mb-2">
          <label className="form-label text-muted small mb-1">From</label>
          <div className="position-relative" ref={fromPickerRef}>
            <div 
              className="form-control d-flex align-items-center cursor-pointer" 
              onClick={() => {
                setShowFromPicker(!showFromPicker);
                setShowToPicker(false);
              }}
            >
              <IconCalendar size={16} className="text-muted me-2" />
              <span>{formatDisplayDate(localDateFrom)}</span>
            </div>
            {showFromPicker && (
              <div className="position-absolute start-0 mt-1 z-index-10">
                <DatePicker
                  selected={localDateFrom}
                  onChange={(date) => {
                    if (date) {
                      setLocalDateFrom(date);
                      // Only close the picker when a date is selected
                      setShowFromPicker(false);
                    }
                  }}
                  selectsStart
                  startDate={localDateFrom}
                  endDate={localDateTo}
                  maxDate={localDateTo}
                  inline
                  calendarClassName="shadow-sm border rounded bg-white"
                  monthsShown={1}
                  showPopperArrow={false}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="col-12">
          <label className="form-label text-muted small mb-1">To</label>
          <div className="position-relative" ref={toPickerRef}>
            <div 
              className="form-control d-flex align-items-center cursor-pointer" 
              onClick={() => {
                setShowToPicker(!showToPicker);
                setShowFromPicker(false);
              }}
            >
              <IconCalendar size={16} className="text-muted me-2" />
              <span>{formatDisplayDate(localDateTo)}</span>
            </div>
            {showToPicker && (
              <div className="position-absolute start-0 mt-1 z-index-10">
                <DatePicker
                  selected={localDateTo}
                  onChange={(date) => {
                    if (date) {
                      setLocalDateTo(date);
                      // Only close the picker when a date is selected
                      setShowToPicker(false);
                    }
                  }}
                  selectsEnd
                  startDate={localDateFrom}
                  endDate={localDateTo}
                  minDate={localDateFrom}
                  maxDate={new Date()}
                  inline
                  calendarClassName="shadow-sm border rounded bg-white"
                  monthsShown={1}
                  showPopperArrow={false}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Apply button - only show when changes need to be applied */}
        {datesChanged && (
          <div className="col-12 mt-2">
            <button
              className="btn btn-primary w-100 btn-sm"
              onClick={applyDateChanges}
            >
              <IconCheck size={16} className="me-1" />
              Apply Date Filter
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="btn-group w-100">
          <button 
            type="button" 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => handlePresetDateRange(7)}
          >
            Week
          </button>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => handlePresetDateRange(30)}
          >
            Month
          </button>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => handlePresetDateRange(90)}
          >
            3 Months
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector; 