export const SUPPORTED_LANGUAGES = {
  ENGLISH: 'en',
  SWAHILI: 'sw',
  PORTUGUESE: 'pt',
} as const;

export const LANGUAGE_FLAGS = {
  [SUPPORTED_LANGUAGES.ENGLISH]: '🇺🇸',
  [SUPPORTED_LANGUAGES.SWAHILI]: '🇹🇿',
  [SUPPORTED_LANGUAGES.PORTUGUESE]: '🇲🇿',
} as const;

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.ENGLISH;

export const LANGUAGE_NAMES = {
  [SUPPORTED_LANGUAGES.ENGLISH]: 'language.english',
  [SUPPORTED_LANGUAGES.SWAHILI]: 'language.swahili',
  [SUPPORTED_LANGUAGES.PORTUGUESE]: 'language.portuguese',
} as const; 