/**
 * Phone number utilities for handling country codes based on user's country
 */

/**
 * Map of country names to their international dialing codes
 * Based on the countries supported in the application
 */
export const COUNTRY_PHONE_CODES = {
  'Tanzania': '+255',
  'Zanzibar': '+255', // Zanzibar uses Tanzania's country code
  'Kenya': '+254',
  'Mozambique': '+258'
};

/**
 * Get the country code for a given country name
 * @param {string} country - Country name (e.g., 'Tanzania', 'Kenya')
 * @returns {string|null} Country code (e.g., '+255') or null if not found
 */
export function getCountryCode(country) {
  if (!country) return null;
  return COUNTRY_PHONE_CODES[country] || null;
}

/**
 * Format a phone number with country code
 * @param {string} phoneNumber - Phone number (can be with or without country code)
 * @param {string} country - User's country name
 * @returns {string} Formatted phone number with country code
 */
export function formatPhoneWithCountryCode(phoneNumber, country) {
  if (!phoneNumber) return '';

  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.trim();

  // If already has country code (starts with +), return as is
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/[\s\-\(\)]/g, '');
  }

  // Remove any other formatting
  cleaned = cleaned.replace(/[\s\-\(\)]/g, '');

  // Get country code for the user's country
  const countryCode = getCountryCode(country);
  if (!countryCode) {
    // If we can't determine country code, assume it's already formatted
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  // Remove leading zeros (common in local phone numbers)
  cleaned = cleaned.replace(/^0+/, '');

  // Add country code
  return `${countryCode}${cleaned}`;
}

/**
 * Normalize phone number for comparison (remove all formatting)
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string} Normalized phone number (digits only, no +)
 */
export function normalizePhone(phoneNumber) {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/[\s\-\(\)\+]/g, '');
}

/**
 * Check if two phone numbers match (handles different formats)
 * @param {string} phone1 - First phone number
 * @param {string} phone2 - Second phone number
 * @returns {boolean} True if phones match
 */
export function phonesMatch(phone1, phone2) {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);

  // Exact match
  if (normalized1 === normalized2) return true;

  // Check if one ends with the other (handles missing country codes)
  if (normalized1.endsWith(normalized2) || normalized2.endsWith(normalized1)) {
    return true;
  }

  return false;
}

/**
 * Validate phone number format for a specific country
 * @param {string} phoneNumber - Phone number to validate (without country code)
 * @param {string} country - Country name
 * @returns {boolean} True if valid format
 */
export function isValidPhoneForCountry(phoneNumber, country) {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '');

  // Basic validation: should be 9-10 digits for East African countries
  const digitPattern = /^\d{9,10}$/;

  if (!digitPattern.test(cleaned)) {
    return false;
  }

  // Country-specific validation
  switch (country) {
    case 'Tanzania':
    case 'Zanzibar':
      // Tanzanian mobile numbers: 9 digits starting with 6 or 7
      return /^[67]\d{8}$/.test(cleaned);

    case 'Kenya':
      // Kenyan mobile numbers: 9 digits starting with 7 or 1
      return /^[17]\d{8}$/.test(cleaned);

    case 'Mozambique':
      // Mozambican mobile numbers: 9 digits starting with 8
      return /^8\d{8}$/.test(cleaned);

    default:
      // Generic validation: 9-10 digits
      return true;
  }
}

/**
 * Get example phone number format for a country
 * @param {string} country - Country name
 * @returns {string} Example phone number
 */
export function getPhoneExample(country) {
  switch (country) {
    case 'Tanzania':
    case 'Zanzibar':
      return '712345678 or 0712345678';
    case 'Kenya':
      return '712345678 or 0712345678';
    case 'Mozambique':
      return '821234567 or 0821234567';
    default:
      return '712345678';
  }
}
