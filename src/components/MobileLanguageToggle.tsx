import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage } from '@tabler/icons-react';
import { useLanguage } from '../hooks/useLanguage';

const MobileLanguageToggle: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();

  const handleLanguageToggle = () => {
    toggleLanguage();
  };

  return (
    <div className="nav-item me-2 d-md-none mobile-language-toggle">
      <button
        className="nav-link px-0 btn-icon"
        type="button"
        onClick={handleLanguageToggle}
        title={`${t('language.selectLanguage')} (${currentLanguage.flag})`}
      >
        <IconLanguage size={20} />
      </button>
    </div>
  );
};

export default MobileLanguageToggle; 