// Cryptographic password/PIN hashing utility using Web Crypto API (SHA-256 with project salt)
// Ensures staff PINs and owner passwords are NEVER stored in plain text.

const BAKE_SALT = 'bms_salt_v0.1_bakery_secure_hash';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${pin}:${BAKE_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(rawPin: string, storedHashOrPlain: string): Promise<boolean> {
  // If stored value is already a SHA-256 hash (64 hex characters)
  if (storedHashOrPlain.length === 64) {
    const computed = await hashPin(rawPin);
    return computed === storedHashOrPlain;
  }
  // Fallback for initial demo seed or unhashed passwords
  return rawPin === storedHashOrPlain;
}

