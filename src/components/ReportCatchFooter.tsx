import React from 'react';
import { IconClipboardText } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ReportCatchFooterProps {
  onReportCatchClick: () => void;
}

const ReportCatchFooter: React.FC<ReportCatchFooterProps> = ({ onReportCatchClick }) => {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center justify-content-center">
      <button
        className="btn w-100 d-flex align-items-center justify-content-center position-relative"
        onClick={onReportCatchClick}
        style={{ 
          minHeight: '45px',
          backgroundColor: '#e74c3c',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(231, 76, 60, 0.25)',
          color: 'white',
          transition: 'all 0.2s ease'
        }}
      >
        <IconClipboardText className="me-2" size={20} style={{ color: 'white' }} />
        <span className="fw-bold" style={{ color: 'white' }}>{t('catch.reportCatch')}</span>
        <span 
          className="badge position-absolute top-0 rounded-pill" 
          style={{ 
            fontSize: '0.65rem', 
            right: '-1px', 
            transform: 'translateY(-50%)',
            fontWeight: '600',
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none'
          }}
        >
          NEW
        </span>
      </button>
    </div>
  );
};

export default ReportCatchFooter;