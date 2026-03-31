const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return {
    encryptedKey: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

function decrypt(encryptedKey, ivBase64, authTagBase64) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedKey, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
