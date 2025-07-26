import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage, IconCheck } from '@tabler/icons-react';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'sw', name: t('language.swahili'), flag: '🇹🇿' },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button
        className="btn btn-outline-secondary dropdown-toggle"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('language.selectLanguage')}
      >
        <IconLanguage size={18} className="me-1" />
        <span className="d-none d-sm-inline">{t('language.selectLanguage')}</span>
      </button>
      {isOpen && (
        <ul className="dropdown-menu dropdown-menu-end show">
          {languages.map((language) => (
            <li key={language.code}>
              <button
                className={`dropdown-item d-flex align-items-center ${
                  i18n.language === language.code ? 'active' : ''
                }`}
                onClick={() => handleLanguageChange(language.code)}
                type="button"
              >
                <span className="me-2">{language.flag}</span>
                <span className="flex-grow-1">{language.name}</span>
                {i18n.language === language.code && (
                  <IconCheck size={16} className="text-primary" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher; 