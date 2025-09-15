import * as crypto from 'crypto';

export function sha256Hex(v: string) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function randomUrlToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url'); // URL-safe
}
