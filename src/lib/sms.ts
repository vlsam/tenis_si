import 'server-only';
import { createHash } from 'crypto';

/**
 * Ports EuroSmsService.js from the Sails variants - sends the club an SMS
 * asking them to reply "A-XXX"/"N-XXX" to confirm/reject a new booking.
 * Their reply is picked up by /api/orders/sms/[secret]. Uses Node's built-in
 * `crypto` for the MD5 signature instead of pulling in the `md5` package.
 *
 * NOTE: unverified against the live EuroSMS API (no network access in the
 * environment this was built in) - the message-encoding quirk below is
 * carried over as-is from the original JS rather than "fixed", since it's
 * not obvious whether EuroSMS's API actually expects it. Smoke-test one
 * real send before relying on this.
 */

const BASE_URL = 'http://as.eurosms.com/sms/Sender?action=send1SMSHTTP';

// The original app escaped exactly these 6 characters to their %XX form and
// left everything else (spaces, diacritics, ...) for the HTTP client's own
// query-string encoder to handle - mirrored here by encoding the message
// with encodeURIComponent (which leaves these 6 alone) and then additionally
// escaping them, same net effect as the original.
function encodeSmsText(text: string): string {
  return encodeURIComponent(text)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E');
}

function createSignature(integrationKey: string, phoneNumber: string): string {
  const md5hash = createHash('md5').update(integrationKey + phoneNumber).digest('hex');
  return md5hash.substring(10, 21);
}

export async function sendSmsConfirmationRequest(phoneNumber: string, messageText: string): Promise<void> {
  const integrationId = process.env.EUROSMS_INTEGRATION_ID;
  const integrationKey = process.env.EUROSMS_INTEGRATION_KEY;
  const senderNumber = process.env.EUROSMS_NUMBER;

  if (!integrationId || !integrationKey || !senderNumber) {
    console.warn('EuroSMS not configured (EUROSMS_INTEGRATION_ID/KEY/NUMBER) - skipping SMS notification');
    return;
  }

  const normalizedNumber = phoneNumber.replace('+', '00');
  // `msg` is already percent-encoded by encodeSmsText, so it's appended
  // as-is rather than through URLSearchParams (which would double-encode
  // the `%` signs); the other params are plain alphanumeric/known-safe.
  const query = new URLSearchParams({
    i: integrationId,
    s: createSignature(integrationKey, normalizedNumber),
    f: '0',
    sender: senderNumber,
    number: normalizedNumber
  });

  try {
    const response = await fetch(`${BASE_URL}&${query.toString()}&msg=${encodeSmsText(messageText)}`);
    if (!response.ok) {
      console.error('EuroSMS send failed', response.status, await response.text());
    }
  } catch (err) {
    console.error('EuroSMS send failed', err);
  }
}
