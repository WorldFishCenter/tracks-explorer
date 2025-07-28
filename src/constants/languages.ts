export const SUPPORTED_LANGUAGES = {
  ENGLISH: 'en',
  SWAHILI: 'sw',
} as const;

export const LANGUAGE_FLAGS = {
  [SUPPORTED_LANGUAGES.ENGLISH]: '🇺🇸',
  [SUPPORTED_LANGUAGES.SWAHILI]: '🇹🇿',
} as const;

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.ENGLISH;

export const LANGUAGE_NAMES = {
  [SUPPORTED_LANGUAGES.ENGLISH]: 'language.english',
  [SUPPORTED_LANGUAGES.SWAHILI]: 'language.swahili',
} as const; 