import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from 'react-i18next';
import FeedbackForm from '../components/feedback/FeedbackForm';

const Feedback: React.FC = () => {
  const { t } = useTranslation();
  const [formKey, setFormKey] = useState(0);

  const handleSuccess = () => {
    // Reset form by incrementing key to force re-mount
    setFormKey(prev => prev + 1);
  };

  const pageHeader = (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <h2 className="page-title mb-0 mt-0">
          {t('feedback.title')}
        </h2>
        <div className="page-pretitle text-secondary">
          {t('feedback.subtitle')}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout pageHeader={pageHeader}>
      <div className="card">
        <div className="card-body">
          <FeedbackForm key={formKey} onSuccess={handleSuccess} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Feedback;





