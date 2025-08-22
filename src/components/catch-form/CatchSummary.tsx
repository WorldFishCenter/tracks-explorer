import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconBan } from '@tabler/icons-react';
import { CatchEntry } from '../../types';

interface CatchSummaryProps {
  noCatch: boolean;
  catches: CatchEntry[];
  isDarkMode: boolean;
}

const CatchSummary: React.FC<CatchSummaryProps> = ({ noCatch, catches, isDarkMode }) => {
  const { t } = useTranslation();

  const totalWeight = catches.reduce((sum, catchEntry) => sum + (catchEntry.quantity || 0), 0);

  return (
    <div className={`card ${isDarkMode ? 'bg-dark' : 'bg-light'}`}>
      <div className="card-header p-3">
        <h5 className="card-title mb-0">{t('catch.summary')}</h5>
      </div>
      <div className="card-body p-3">
        {noCatch ? (
          <div className="text-center text-muted">
            <IconBan size={32} className="mb-2" />
            <p>{t('catch.noCatchWillBeReported')}</p>
          </div>
        ) : (
          <>
            <h6 className="mb-2">{t('catch.catchEntries')}:</h6>
            {catches.map((catchEntry, index) => (
              <div key={catchEntry.id} className="d-flex justify-content-between mb-1 small">
                <span>{t(`catch.fishGroups.${catchEntry.fishGroup.replace(/[^a-zA-Z]/g, '')}`)}</span>
                <span className="fw-bold">{catchEntry.quantity || 0} kg</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between fw-bold">
              <span>{t('catch.totalWeight')}:</span>
              <span>{totalWeight.toFixed(1)} kg</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(CatchSummary);