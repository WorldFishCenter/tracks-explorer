import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { useLanguage } from '../hooks/useLanguage';

const MobileLanguageToggle: React.FC = () => {
  const { t } = useTranslation();
  const { languages, currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  return (
    <div className="nav-item dropdown me-2 d-md-none">
      <a
        href="#"
        className="nav-link d-flex align-items-center px-2 py-2"
        data-bs-toggle="dropdown"
        aria-label={t('language.selectLanguage')}
        style={{ minHeight: '44px' }}
      >
        <IconLanguage size={20} className="me-1" />
        <IconChevronDown size={14} />
      </a>
      <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
        <div className="dropdown-header">
          <small className="text-muted">{t('language.selectLanguage')}</small>
        </div>
        {languages.map((language) => (
          <a
            key={language.code}
            href="#"
            className={`dropdown-item d-flex align-items-center ${
              currentLanguage.code === language.code ? 'active' : ''
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleLanguageChange(language.code);
            }}
          >
            <span className="me-2 fs-5">{language.flag}</span>
            <span className="flex-grow-1">{language.name}</span>
            {currentLanguage.code === language.code && (
              <IconCheck size={16} className="text-primary" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default MobileLanguageToggle; 