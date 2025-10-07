import * as crypto from 'crypto';

export function sha256Hex(v: string) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function randomUrlToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url'); // URL-safe
}

export function randomVerificationCode(length = 6): string {
  // 6자리 숫자 인증 코드 생성 (100000 ~ 999999)
  // 보안: crypto.randomBytes 사용하여 암호학적으로 안전한 난수 생성
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const range = max - min + 1;

  // 4 bytes (32 bits)면 6자리 코드 생성에 충분
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);

  // 모듈로 연산으로 범위 내 숫자 생성
  const code = min + (randomNumber % range);
  return code.toString();
}
