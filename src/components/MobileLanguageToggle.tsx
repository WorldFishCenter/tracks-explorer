import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage, IconCheck } from '@tabler/icons-react';
import { useLanguage } from '../hooks/useLanguage';

const MobileLanguageToggle: React.FC = () => {
  const { t } = useTranslation();
  const { languages, currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  return (
    <div className="nav-item dropdown me-2 d-md-none">
      <button
        className="nav-link px-2 btn btn-ghost-secondary btn-icon"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title={t('language.selectLanguage')}
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <IconLanguage size={20} />
      </button>
      <div className="dropdown-menu dropdown-menu-end">
        <div className="dropdown-header">
          <small className="text-muted">{t('language.selectLanguage')}</small>
        </div>
        {languages.map((language) => (
          <button
            key={language.code}
            className={`dropdown-item d-flex align-items-center ${
              currentLanguage.code === language.code ? 'active' : ''
            }`}
            onClick={() => handleLanguageChange(language.code)}
            type="button"
            style={{ minHeight: '44px' }}
          >
            <span className="me-2 fs-5">{language.flag}</span>
            <span className="flex-grow-1">{language.name}</span>
            {currentLanguage.code === language.code && (
              <IconCheck size={16} className="text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileLanguageToggle; 