import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_NAMES } from '../constants/languages';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const useLanguage = () => {
  const { t, i18n } = useTranslation();

  const languages: Language[] = [
    { 
      code: SUPPORTED_LANGUAGES.ENGLISH, 
      name: t(LANGUAGE_NAMES[SUPPORTED_LANGUAGES.ENGLISH]), 
      flag: LANGUAGE_FLAGS[SUPPORTED_LANGUAGES.ENGLISH] 
    },
    { 
      code: SUPPORTED_LANGUAGES.SWAHILI, 
      name: t(LANGUAGE_NAMES[SUPPORTED_LANGUAGES.SWAHILI]), 
      flag: LANGUAGE_FLAGS[SUPPORTED_LANGUAGES.SWAHILI] 
    },
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const getCurrentLanguage = (): Language => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  const toggleLanguage = () => {
    const currentLang = i18n.language;
    const nextLang = currentLang === SUPPORTED_LANGUAGES.ENGLISH 
      ? SUPPORTED_LANGUAGES.SWAHILI 
      : SUPPORTED_LANGUAGES.ENGLISH;
    changeLanguage(nextLang);
  };

  return {
    languages,
    currentLanguage: getCurrentLanguage(),
    changeLanguage,
    toggleLanguage,
    isEnglish: i18n.language === SUPPORTED_LANGUAGES.ENGLISH,
    isSwahili: i18n.language === SUPPORTED_LANGUAGES.SWAHILI,
  };
}; 