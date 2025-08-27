import React from 'react';
import { IconFish } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ReportCatchFooterProps {
  onReportCatchClick: () => void;
}

const ReportCatchFooter: React.FC<ReportCatchFooterProps> = ({ onReportCatchClick }) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center justify-content-center">
      <button
        className="btn btn-primary w-100 d-flex align-items-center justify-content-center position-relative"
        onClick={onReportCatchClick}
        style={{ minHeight: '45px' }}
      >
        <IconFish className="me-2" size={20} />
        <span className="fw-bold">{t('catch.reportCatch')}</span>
        <span 
          className="badge bg-yellow text-dark position-absolute top-0 rounded-pill" 
          style={{ 
            fontSize: '0.65rem', 
            right: '-1px', 
            transform: 'translateY(-50%)'
          }}
        >
          NEW
        </span>
      </button>
    </div>
  );
};

export default ReportCatchFooter;