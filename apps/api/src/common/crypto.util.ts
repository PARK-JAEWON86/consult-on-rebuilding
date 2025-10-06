import * as crypto from 'crypto';

export function sha256Hex(v: string) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function randomUrlToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url'); // URL-safe
}

export function randomVerificationCode(length = 6): string {
  // 6자리 숫자 인증 코드 생성 (100000 ~ 999999)
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}
