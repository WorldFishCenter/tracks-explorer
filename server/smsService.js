import AfricasTalking from 'africastalking';

/**
 * Get country-specific credentials dynamically (lazy evaluation to ensure env vars are loaded)
 * Each country may have its own AT account for better routing and pricing
 */
function getCountryCredentials() {
  return {
    'Kenya': {
      username: process.env.AT_USERNAME_KENYA || process.env.AT_USERNAME,
      apiKey: process.env.AT_API_KEY_KENYA || process.env.AT_API_KEY,
      senderId: process.env.AT_SENDER_ID_KENYA || process.env.AT_SENDER_ID
    },
    'Tanzania': {
      username: process.env.AT_USERNAME,
      apiKey: process.env.AT_API_KEY,
      senderId: process.env.AT_SENDER_ID
    },
    'Zanzibar': {
      username: process.env.AT_USERNAME,
      apiKey: process.env.AT_API_KEY,
      senderId: process.env.AT_SENDER_ID
    },
    'Mozambique': {
      username: process.env.AT_USERNAME,
      apiKey: process.env.AT_API_KEY,
      senderId: process.env.AT_SENDER_ID
    }
  };
}

// Cache for SMS clients per country
const smsClientCache = {};

/**
 * Get credentials for a specific country
 * @param {string} country - Country name
 * @returns {Object} Credentials object with username, apiKey, and senderId
 */
function getCredentialsForCountry(country) {
  const credentials = getCountryCredentials();
  return credentials[country] || credentials['Tanzania']; // Default to Tanzania
}

/**
 * Detect country from phone number
 * @param {string} phoneNumber - Phone number with country code
 * @returns {string|null} Country name or null
 */
function detectCountryFromPhone(phoneNumber) {
  const normalized = phoneNumber.replace(/\D/g, ''); // Remove non-digits

  if (normalized.startsWith('254')) return 'Kenya';
  if (normalized.startsWith('255')) return 'Tanzania';
  if (normalized.startsWith('258')) return 'Mozambique';
  if (normalized.startsWith('256')) return 'Uganda';

  return null;
}

/**
 * Initialize the SMS client with Africa's Talking credentials for a specific country
 * @param {string} country - Country name (e.g., 'Kenya', 'Tanzania')
 * @returns {Object} SMS client instance
 */
const initializeSMSClient = (country = 'Tanzania') => {
  // Check cache first
  if (smsClientCache[country]) {
    return smsClientCache[country];
  }

  const credentials = getCredentialsForCountry(country);
  const { username, apiKey } = credentials;

  if (!username || !apiKey) {
    console.error(`Africa's Talking credentials not configured for ${country}. Please set credentials in .env`);
    return null;
  }

  try {
    const africastalking = AfricasTalking({
      username,
      apiKey
    });

    const client = africastalking.SMS;
    smsClientCache[country] = client;

    console.log(`Africa's Talking SMS client initialized for ${country}`);
    console.log(`  Username: ${username}`);
    console.log(`  API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`);
    console.log(`  Sender ID: ${credentials.senderId || 'Not set'}`);
    return client;
  } catch (error) {
    console.error(`Failed to initialize Africa's Talking SMS client for ${country}:`, error);
    return null;
  }
};

/**
 * Send SMS message via Africa's Talking
 * @param {string} phoneNumber - Recipient phone number (international format, e.g., +254712345678)
 * @param {string} message - SMS message content
 * @param {string} country - Country name for routing to correct AT account (e.g., 'Kenya', 'Tanzania')
 * @returns {Promise<Object>} Result object with success status and message details
 */
export async function sendSMS(phoneNumber, message, country = null) {
  // Detect country from phone number if not provided
  if (!country) {
    country = detectCountryFromPhone(phoneNumber) || 'Tanzania';
  }

  const client = initializeSMSClient(country);

  if (!client) {
    throw new Error(`SMS service not configured for ${country}. Please check Africa's Talking credentials.`);
  }

  // Validate phone number format
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Invalid phone number provided');
  }

  // Ensure phone number is in international format
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith('+')) {
    // If no country code, this will fail - Africa's Talking requires international format
    console.warn(`Phone number ${phoneNumber} may be missing country code. Adding + prefix.`);
    formattedPhone = `+${formattedPhone}`;
  }

  // Validate message
  if (!message || typeof message !== 'string' || message.length === 0) {
    throw new Error('Invalid message content');
  }

  // Get country-specific sender ID
  const credentials = getCredentialsForCountry(country);
  const senderId = credentials.senderId;

  // Prepare SMS options
  const options = {
    to: [formattedPhone],
    message,
    // Use country-specific sender ID if configured
    ...(senderId && { from: senderId })
  };

  try {
    console.log(`Sending SMS to ${formattedPhone} via ${country} account (${credentials.username})...`);
    const response = await client.send(options);

    console.log('Africa\'s Talking API Response:', JSON.stringify(response, null, 2));

    // Africa's Talking response structure:
    // {
    //   SMSMessageData: {
    //     Message: "Sent to 1/1 Total Cost: KES 0.8000",
    //     Recipients: [{
    //       statusCode: 101,
    //       number: "+254711XXXYYY",
    //       status: "Success",
    //       cost: "KES 0.8000",
    //       messageId: "ATXid_xxx"
    //     }]
    //   }
    // }

    const recipients = response.SMSMessageData?.Recipients || [];
    const firstRecipient = recipients[0];

    if (!firstRecipient) {
      console.error('Africa\'s Talking returned no recipients. Full response:', response);
      throw new Error(`No recipient information in SMS response. This may mean the phone number is not whitelisted in sandbox mode or is not supported by Africa's Talking.`);
    }

    // Status codes: 101 = Success, 102 = Queued, others = Failed
    const isSuccess = firstRecipient.statusCode === 101 || firstRecipient.statusCode === 102;

    if (isSuccess) {
      console.log(`SMS sent successfully to ${formattedPhone}. Status: ${firstRecipient.status}, Cost: ${firstRecipient.cost}`);
      return {
        success: true,
        messageId: firstRecipient.messageId,
        status: firstRecipient.status,
        cost: firstRecipient.cost,
        recipient: formattedPhone,
        country: country
      };
    } else {
      console.error(`SMS failed to ${formattedPhone}. Status code: ${firstRecipient.statusCode}, Status: ${firstRecipient.status}`);
      throw new Error(`SMS delivery failed: ${firstRecipient.status}`);
    }
  } catch (error) {
    console.error('Error sending SMS via Africa\'s Talking:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Send OTP (One-Time Password) SMS for password reset
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - 6-digit OTP code
 * @param {string} country - User's country for routing to correct AT account
 * @returns {Promise<Object>} Result object with success status
 */
export async function sendPasswordResetOTP(phoneNumber, otp, country = null) {
  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP format. Must be 6 digits.');
  }

  // Detect country from phone if not provided
  if (!country) {
    country = detectCountryFromPhone(phoneNumber) || 'Tanzania';
  }

  // Development mode: Skip SMS sending for non-East African numbers in sandbox
  // This allows testing without real SMS when using non-supported phone numbers
  const credentials = getCredentialsForCountry(country);
  const isSandbox = credentials.username === 'sandbox';
  const isEastAfricanNumber = /^\+?(254|255|256|258)/.test(phoneNumber); // Kenya, Tanzania, Uganda, Mozambique

  if (isSandbox && !isEastAfricanNumber) {
    console.log('='.repeat(80));
    console.log('📱 DEVELOPMENT MODE - SMS BYPASS (Sandbox)');
    console.log('='.repeat(80));
    console.log(`Phone number: ${phoneNumber}`);
    console.log(`Country: ${country}`);
    console.log(`🔑 OTP CODE: ${otp}`);
    console.log(`⏱️  Expires in: 10 minutes`);
    console.log('='.repeat(80));
    console.log('NOTE: Africa\'s Talking sandbox only supports East African numbers.');
    console.log('For production with international numbers, add credit and use production credentials.');
    console.log('='.repeat(80));

    // Return mock success response
    return {
      success: true,
      messageId: 'DEV_MODE_' + Date.now(),
      status: 'Development',
      cost: 'KES 0.00',
      recipient: phoneNumber,
      country: country
    };
  }

  // Construct OTP message
  const message = `Your Tracks Explorer password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.`;

  try {
    const result = await sendSMS(phoneNumber, message, country);
    console.log(`Password reset OTP sent successfully to ${phoneNumber} via ${country} account`);
    return result;
  } catch (error) {
    console.error(`Failed to send password reset OTP to ${phoneNumber}:`, error);
    throw error;
  }
}

/**
 * Generate a random 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
export function generateOTP() {
  // Generate random 6-digit number (100000 - 999999)
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}
