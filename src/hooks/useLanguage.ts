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
    { 
      code: SUPPORTED_LANGUAGES.PORTUGUESE, 
      name: t(LANGUAGE_NAMES[SUPPORTED_LANGUAGES.PORTUGUESE]), 
      flag: LANGUAGE_FLAGS[SUPPORTED_LANGUAGES.PORTUGUESE] 
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
    let nextLang: string;
    
    switch (currentLang) {
      case SUPPORTED_LANGUAGES.ENGLISH:
        nextLang = SUPPORTED_LANGUAGES.SWAHILI;
        break;
      case SUPPORTED_LANGUAGES.SWAHILI:
        nextLang = SUPPORTED_LANGUAGES.PORTUGUESE;
        break;
      case SUPPORTED_LANGUAGES.PORTUGUESE:
        nextLang = SUPPORTED_LANGUAGES.ENGLISH;
        break;
      default:
        nextLang = SUPPORTED_LANGUAGES.ENGLISH;
    }
    
    changeLanguage(nextLang);
  };

  return {
    languages,
    currentLanguage: getCurrentLanguage(),
    changeLanguage,
    toggleLanguage,
    isEnglish: i18n.language === SUPPORTED_LANGUAGES.ENGLISH,
    isSwahili: i18n.language === SUPPORTED_LANGUAGES.SWAHILI,
    isPortuguese: i18n.language === SUPPORTED_LANGUAGES.PORTUGUESE,
  };
}; 