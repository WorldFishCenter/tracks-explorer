import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage, IconCheck } from '@tabler/icons-react';
import { useLanguage } from '../hooks/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { languages, currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
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
        className="nav-link px-0 btn-icon"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('language.selectLanguage')}
        data-bs-toggle="dropdown"
        aria-expanded={isOpen}
      >
        <IconLanguage size={20} />
      </button>
      <ul className={`dropdown-menu ${isOpen ? 'show' : ''}`} style={{ minWidth: '200px' }}>
        {languages.map((language) => (
          <li key={language.code}>
            <button
              className={`dropdown-item d-flex align-items-center ${
                currentLanguage.code === language.code ? 'active' : ''
              }`}
              onClick={() => handleLanguageChange(language.code)}
              type="button"
            >
              <span className="me-2">{language.flag}</span>
              <span className="flex-grow-1">{language.name}</span>
              {currentLanguage.code === language.code && (
                <IconCheck size={16} className="text-primary" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageSwitcher; 