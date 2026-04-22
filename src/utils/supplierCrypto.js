/**
 * supplierCrypto.js
 * -----------------
 * AES-256-CBC encrypt/decrypt for supplier name & phone.
 * Stored in DB as: <hex-iv>:<hex-ciphertext>
 *
 * The key must be exactly 32 bytes. SUPPLIER_ENCRYPTION_KEY in .env is
 * padded / truncated to 32 bytes here so the app starts even if the
 * variable is slightly off — but production should use exactly 32 chars.
 */
const crypto = require('node:crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const getKey = () => {
  const raw = process.env.SUPPLIER_ENCRYPTION_KEY || '';
  // Pad or truncate to exactly 32 bytes
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32));
};

/**
 * Encrypt a plain-text string.
 * Returns null if value is null/undefined/empty (preserves nullable fields).
 */
const encrypt = (plainText) => {
  if (plainText == null || plainText === '') return plainText;
  const iv         = crypto.randomBytes(IV_LENGTH);
  const cipher     = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted  = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt a stored ciphertext string.
 * Returns the original value unchanged if it does not look like an
 * encrypted value (guards against double-decryption on plain rows).
 */
const decrypt = (cipherText) => {
  if (cipherText == null || cipherText === '') return cipherText;
  // If it doesn't match iv:ciphertext pattern, it is still plaintext (not yet migrated)
  if (!cipherText.includes(':')) return cipherText;
  try {
    const [ivHex, encHex] = cipherText.split(':');
    const iv         = Buffer.from(ivHex, 'hex');
    const encrypted  = Buffer.from(encHex, 'hex');
    const decipher   = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    // Corrupt or plain value — return as-is so app never hard-crashes on read
    return cipherText;
  }
};

module.exports = { encrypt, decrypt };
