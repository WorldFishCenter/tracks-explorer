import i18n from './index';

// Test the i18n configuration
console.log('Testing i18n configuration...');

// Test English
i18n.changeLanguage('en');
console.log('English - Dashboard title:', i18n.t('dashboard.title'));
console.log('English - Login title:', i18n.t('auth.loginTitle'));

// Test Swahili
i18n.changeLanguage('sw');
console.log('Swahili - Dashboard title:', i18n.t('dashboard.title'));
console.log('Swahili - Login title:', i18n.t('auth.loginTitle'));

// Test interpolation
i18n.changeLanguage('en');
console.log('English - Date range:', i18n.t('dashboard.dateRange', {
  from: 'Jan 1, 2024',
  to: 'Jan 7, 2024',
  days: 7
}));

i18n.changeLanguage('sw');
console.log('Swahili - Date range:', i18n.t('dashboard.dateRange', {
  from: 'Jan 1, 2024',
  to: 'Jan 7, 2024',
  days: 7
}));

// Test language switcher functionality
console.log('Testing language switcher...');
console.log('Current language:', i18n.language);
console.log('Available languages:', i18n.languages);
console.log('Language detection order:', i18n.options.detection?.order);

console.log('i18n test completed!'); 