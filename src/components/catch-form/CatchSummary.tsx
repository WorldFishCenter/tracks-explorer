import React from 'react';
import { useTranslation } from 'react-i18next';
import { Ban } from 'lucide-react';
import { CatchEntry } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CatchSummaryProps {
  noCatch: boolean;
  catches: CatchEntry[];
  isDarkMode?: boolean; // Make optional since we're using shadcn/ui theming
}

const CatchSummary: React.FC<CatchSummaryProps> = ({ noCatch, catches, isDarkMode }) => {
  const { t } = useTranslation();

  const totalWeight = catches.reduce((sum, catchEntry) => sum + (catchEntry.quantity || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('catch.summary')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noCatch ? (
          <div className="text-center text-muted-foreground">
            <Ban size={32} className="mx-auto mb-2" />
            <p>{t('catch.noCatchWillBeReported')}</p>
          </div>
        ) : (
          <>
            <h6 className="text-sm font-medium mb-3">{t('catch.catchEntries')}:</h6>
            <div className="space-y-2">
              {catches.map((catchEntry, index) => (
                <div key={catchEntry.id} className="flex justify-between items-center text-sm">
                  <span>{t(`catch.fishGroups.${catchEntry.fishGroup.replace(/[^a-zA-Z]/g, '')}`)}</span>
                  <span className="font-semibold">{catchEntry.quantity || 0} kg</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>{t('catch.totalWeight')}:</span>
              <span>{totalWeight.toFixed(1)} kg</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CatchSummary);