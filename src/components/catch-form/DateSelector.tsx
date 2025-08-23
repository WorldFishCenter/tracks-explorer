import React from 'react';
import { useTranslation } from 'react-i18next';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelection: (daysAgo: number) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateSelection }) => {
  const { t } = useTranslation();

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = selectedDate.toDateString() === yesterday.toDateString();
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const isTwoDaysAgo = selectedDate.toDateString() === twoDaysAgo.toDateString();

  return (
    <div className="mb-3 mb-lg-4">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h4 className="mb-0">{t('catch.whenWasCatchMade')}</h4>
        <div className="btn-group" role="group">
          <input 
            type="radio" 
            className="btn-check" 
            name="catchDate" 
            id="today" 
            autoComplete="off" 
            checked={isToday}
            readOnly
          />
          <label 
            className="btn btn-outline-primary" 
            htmlFor="today" 
            onClick={() => onDateSelection(0)}
            style={{ minHeight: '44px' }}
          >
            {t('catch.today')}
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="catchDate" 
            id="yesterday" 
            autoComplete="off"
            checked={isYesterday}
            readOnly
          />
          <label 
            className="btn btn-outline-primary" 
            htmlFor="yesterday" 
            onClick={() => onDateSelection(1)}
            style={{ minHeight: '44px' }}
          >
            {t('catch.yesterday')}
          </label>
          
          <input 
            type="radio" 
            className="btn-check" 
            name="catchDate" 
            id="twoDaysAgo" 
            autoComplete="off"
            checked={isTwoDaysAgo}
            readOnly
          />
          <label 
            className="btn btn-outline-primary" 
            htmlFor="twoDaysAgo" 
            onClick={() => onDateSelection(2)}
            style={{ minHeight: '44px' }}
          >
            {t('catch.twoDaysAgo')}
          </label>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DateSelector);