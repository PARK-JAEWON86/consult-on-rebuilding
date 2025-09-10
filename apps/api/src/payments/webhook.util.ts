import crypto from 'crypto';

export function verifyTossSignature(rawBody: string, signature: string | undefined, secret: string) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  // 기본 비교 (고정시간 비교는 후속 보강)
  return signature === hmac;
}
