let twilioClient = null;

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken && !accountSid.startsWith('your_') && !authToken.startsWith('your_')) {
    if (!twilioClient) {
      const twilio = require('twilio');
      twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
  }
  return null;
};

/**
 * Normalize phone number to E.164 format.
 * Defaults to +91 (India) if country code is not present.
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.toString().trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
};

/**
 * Send an OTP code via Twilio Verify API or Twilio Programmable SMS
 * - If TWILIO_VERIFY_SERVICE_SID is configured (starts with 'VA...'):
 *   Uses Twilio Verify API (NO phone number required!).
 * - If TWILIO_PHONE_NUMBER is configured:
 *   Uses Twilio Programmable Messages API.
 * - Otherwise:
 *   Simulates OTP by logging to server console for local testing.
 */
const sendOtp = async (phone, generatedOtp) => {
  const formattedPhone = formatPhoneNumber(phone);
  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  // 1. Prioritize Twilio Verify API (No phone number required!)
  if (client && verifyServiceSid && verifyServiceSid.startsWith('VA')) {
    try {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: formattedPhone,
          channel: 'sms'
        });

      console.log(`[Twilio Verify API] Verification SMS sent to ${formattedPhone}, Status: ${verification.status}`);
      console.log(`--------------------------------------------------`);
      console.log(`[OTP TEST CODE]: ${generatedOtp}`);
      console.log(`(If Indian carrier Jio/Airtel filters international SMS, you can enter this code in the UI to test!)`);
      console.log(`--------------------------------------------------`);
      return { success: true, mode: 'verify_api', status: verification.status, simulated: false };
    } catch (error) {
      console.error('[Twilio Verify API Error]', error.message);
      console.log('--------------------------------------------------');
      console.log(`[TWILIO OTP NOTICE] Twilio could not deliver SMS to ${formattedPhone}.`);
      console.log(`[REASON] ${error.message}`);
      console.log(`[DEV TEST OTP CODE] Use this OTP to test: ${generatedOtp}`);
      console.log(`[TO RECEIVE SMS ON YOUR REAL PHONE]: Add ${formattedPhone} to Twilio -> Verified Caller IDs`);
      console.log(`(Direct Link: https://console.twilio.com/us1/develop/phone-numbers/manage/verified-caller-ids)`);
      console.log('--------------------------------------------------');
      return { success: false, error: error.message, simulated: true, fallbackOtp: generatedOtp };
    }
  }

  // 2. Programmable SMS API (requires TWILIO_PHONE_NUMBER)
  if (client && twilioPhoneNumber && !twilioPhoneNumber.startsWith('your_') && twilioPhoneNumber.trim() !== '') {
    try {
      const messageBody = `Your CosmeGlow verification code is: ${generatedOtp}. Valid for 5 minutes. Do not share this code with anyone.`;
      const result = await client.messages.create({
        body: messageBody,
        from: twilioPhoneNumber,
        to: formattedPhone
      });
      console.log(`[Twilio SMS API] Sent OTP to ${formattedPhone}, SID: ${result.sid}`);
      return { success: true, mode: 'sms_api', sid: result.sid, simulated: false };
    } catch (error) {
      console.error('[Twilio SMS Error]', error.message);
      console.log(`[Twilio Fallback Console Log] Verification code for ${formattedPhone} is: ${generatedOtp}`);
      return { success: false, error: error.message, simulated: true };
    }
  }

  // 3. Fallback Development Simulation Mode
  console.log(`--------------------------------------------------`);
  console.log(`[TWILIO SIMULATED OTP] Target Phone: ${formattedPhone}`);
  console.log(`[TWILIO SIMULATED OTP] Verification Code: ${generatedOtp}`);
  console.log(`[TIP] Set TWILIO_VERIFY_SERVICE_SID (VA...) in .env to use Twilio Verify without needing a phone number!`);
  console.log(`--------------------------------------------------`);
  return { success: true, mode: 'simulated', simulated: true, otp: generatedOtp };
};

/**
 * Verify an OTP code
 * - If TWILIO_VERIFY_SERVICE_SID is configured: verifies using Twilio Verify API.
 * - Otherwise: returns { useDbCheck: true } so auth controller validates against MongoDB Otp collection.
 */
const verifyOtp = async (phone, otp) => {
  const formattedPhone = formatPhoneNumber(phone);
  const client = getTwilioClient();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (client && verifyServiceSid && verifyServiceSid.startsWith('VA')) {
    try {
      const check = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({
          to: formattedPhone,
          code: otp.toString().trim()
        });

      console.log(`[Twilio Verify Check] Phone: ${formattedPhone}, Status: ${check.status}`);
      if (check.status === 'approved') {
        return { valid: true, mode: 'verify_api' };
      } else {
        // Fall back to database verification before failing
        return { valid: false, useDbCheck: true, reason: 'Invalid or expired OTP code.' };
      }
    } catch (error) {
      console.warn('[Twilio Verify Check Error - Falling back to DB check]:', error.message);
      // If Twilio verification session does not exist (e.g. sending failed due to unverified number),
      // allow database check to validate against MongoDB Otp collection so dev testing does not break.
      return { valid: false, useDbCheck: true };
    }
  }

  // Fallback to DB check
  return { valid: false, useDbCheck: true };
};

module.exports = {
  formatPhoneNumber,
  sendOtp,
  verifyOtp,
  sendOtpSms: sendOtp // backward compatibility
};
