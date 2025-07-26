# Internationalization (i18n) Setup

This document describes the internationalization setup for the Tracks Explorer application, which supports English and Swahili languages.

## Overview

The application uses `react-i18next` for internationalization, following React best practices with:
- **Modular architecture** with custom hooks and components
- **Clean separation of concerns** with dedicated style files
- **Type-safe constants** for language configuration
- **Responsive design** for mobile and desktop
- **Accessibility features** with proper ARIA labels

## Architecture

### File Structure
```
src/
├── i18n/
│   ├── index.ts              # Main i18n configuration
│   └── locales/
│       ├── en.json          # English translations
│       └── sw.json          # Swahili translations
├── components/
│   ├── LanguageSwitcher.tsx     # Desktop language switcher
│   └── MobileLanguageToggle.tsx # Mobile language toggle
├── hooks/
│   └── useLanguage.ts           # Custom language management hook
├── constants/
│   └── languages.ts             # Language constants
└── styles/
    └── components/
        └── language-switcher.scss # Component styles
```

### Key Components

#### 1. LanguageSwitcher
- **Purpose**: Desktop language selection dropdown
- **Features**: Full dropdown with language names and flags
- **Responsive**: Hidden on mobile devices

#### 2. MobileLanguageToggle
- **Purpose**: Mobile-friendly language toggle
- **Features**: Simple icon button that toggles between languages
- **Responsive**: Only visible on mobile devices

#### 3. useLanguage Hook
- **Purpose**: Centralized language management logic
- **Features**: Language switching, current language detection, toggle functionality
- **Reusable**: Can be used across all components

## Supported Languages

- **English (en)**: Primary language
- **Swahili (sw)**: Secondary language for East African users

## Usage

### Basic Translation
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <h1>{t('dashboard.title')}</h1>;
};
```

### Language Management
```typescript
import { useLanguage } from '../hooks/useLanguage';

const MyComponent = () => {
  const { currentLanguage, changeLanguage, toggleLanguage } = useLanguage();
  
  return (
    <button onClick={toggleLanguage}>
      Current: {currentLanguage.name}
    </button>
  );
};
```

### Adding Language Switcher
```typescript
import LanguageSwitcher from '../components/LanguageSwitcher';
import MobileLanguageToggle from '../components/MobileLanguageToggle';

// Desktop version
<LanguageSwitcher />

// Mobile version (automatically handled in MainLayout)
<MobileLanguageToggle />
```

## Translation Keys Organization

Translations are organized into logical sections:

- **common**: Reusable UI elements (buttons, labels, etc.)
- **navigation**: Navigation-related text
- **auth**: Authentication pages and forms
- **dashboard**: Main dashboard content
- **vessel**: Vessel-related information
- **trips**: Trip data and management
- **map**: Map controls and layers
- **insights**: Analytics and insights
- **dateRange**: Date selection components
- **language**: Language switcher text

## Adding New Languages

### 1. Update Constants
```typescript
// src/constants/languages.ts
export const SUPPORTED_LANGUAGES = {
  ENGLISH: 'en',
  SWAHILI: 'sw',
  FRENCH: 'fr', // Add new language
} as const;
```

### 2. Create Translation File
```json
// src/i18n/locales/fr.json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur"
  }
}
```

### 3. Update i18n Configuration
```typescript
// src/i18n/index.ts
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  sw: { translation: sw },
  fr: { translation: fr }, // Add new language
};
```

### 4. Update useLanguage Hook
```typescript
// src/hooks/useLanguage.ts
const languages: Language[] = [
  // ... existing languages
  { 
    code: SUPPORTED_LANGUAGES.FRENCH, 
    name: t(LANGUAGE_NAMES[SUPPORTED_LANGUAGES.FRENCH]), 
    flag: LANGUAGE_FLAGS[SUPPORTED_LANGUAGES.FRENCH] 
  },
];
```

## Best Practices

### 1. Translation Key Naming
- Use descriptive, hierarchical keys: `dashboard.vesselDetails.title`
- Group related translations together
- Use consistent naming conventions

### 2. Component Design
- Separate desktop and mobile components
- Use custom hooks for shared logic
- Keep components focused and single-purpose

### 3. Styling
- Use dedicated SCSS files for component styles
- Follow BEM methodology for CSS classes
- Ensure responsive design for all screen sizes

### 4. Type Safety
- Use TypeScript interfaces for language objects
- Define constants for language codes
- Use const assertions for immutable values

### 5. Performance
- Lazy load translation files if needed
- Use React.memo for components that don't need frequent updates
- Minimize re-renders with proper dependency arrays

## Testing

### Unit Tests
```typescript
import { renderHook } from '@testing-library/react';
import { useLanguage } from '../hooks/useLanguage';

test('useLanguage returns correct current language', () => {
  const { result } = renderHook(() => useLanguage());
  expect(result.current.currentLanguage.code).toBe('en');
});
```

### Integration Tests
```typescript
import { render, screen } from '@testing-library/react';
import LanguageSwitcher from '../components/LanguageSwitcher';

test('language switcher shows all supported languages', () => {
  render(<LanguageSwitcher />);
  expect(screen.getByText('English')).toBeInTheDocument();
  expect(screen.getByText('Kiswahili')).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

1. **Translation not showing**: Check that the key exists in both language files
2. **Language not persisting**: Check localStorage settings in browser dev tools
3. **Mobile toggle not working**: Verify responsive breakpoints and component visibility
4. **Styles not applying**: Check SCSS imports and class names

### Debug Mode

Enable debug mode in development:
```typescript
// src/i18n/index.ts
i18n.init({
  debug: process.env.NODE_ENV === 'development',
  // ... other options
});
```

## Performance Considerations

- Translations are loaded at build time, not runtime
- Language switching is instant
- No additional network requests for translations
- Minimal bundle size impact
- Optimized for mobile performance

## Accessibility

- Language switcher includes proper ARIA labels
- Screen reader friendly language selection
- Keyboard navigation support
- High contrast support through Tabler's built-in theming
- Touch-friendly targets (44px minimum)

## Future Enhancements

- **RTL Support**: Add support for right-to-left languages
- **Dynamic Loading**: Lazy load translation files for better performance
- **Auto-detection**: Improve browser language detection
- **Fallback Chains**: Implement more sophisticated fallback logic
- **Translation Management**: Add tools for managing translations 