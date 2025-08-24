import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
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
    <div className="space-y-4 date-range-selector">
      <div className="space-y-2">
        <Label htmlFor="date-from">{t('dateRange.from')}</Label>
        <div className="relative">
          <DatePicker
            id="date-from"
            selected={dateFrom}
            onChange={handleFromDateChange}
            selectsStart
            startDate={dateFrom}
            endDate={dateTo}
            customInput={<Input className="pl-10" />}
            dateFormat="MMM d, yyyy"
            showPopperArrow={false}
            calendarClassName="shadow-lg border rounded-md"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date-to">{t('dateRange.to')}</Label>
        <div className="relative">
          <DatePicker
            id="date-to"
            selected={dateTo}
            onChange={handleToDateChange}
            selectsEnd
            startDate={dateFrom}
            endDate={dateTo}
            minDate={dateFrom}
            customInput={<Input className="pl-10" />}
            dateFormat="MMM d, yyyy"
            showPopperArrow={false}
            calendarClassName="shadow-lg border rounded-md"
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          type="button" 
          variant={daysDiff === 1 ? "default" : "outline"}
          onClick={handleDay}
          className="h-11"
        >
          {t('dateRange.presets.today')}
        </Button>
        <Button 
          type="button" 
          variant={daysDiff === 7 ? "default" : "outline"}
          onClick={handleWeek}
          className="h-11"
        >
          {t('dateRange.presets.last7Days')}
        </Button>
        <Button 
          type="button" 
          variant={daysDiff === 30 ? "default" : "outline"}
          onClick={handleMonth}
          className="h-11"
        >
          {t('dateRange.presets.last30Days')}
        </Button>
        <Button 
          type="button" 
          variant={daysDiff === 90 ? "default" : "outline"}
          onClick={handleThreeMonths}
          className="h-11"
        >
          {t('dateRange.presets.last90Days')}
        </Button>
      </div>
    </div>
  );
};

export default DateRangeSelector; 