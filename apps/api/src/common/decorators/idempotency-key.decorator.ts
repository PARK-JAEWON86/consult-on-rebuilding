import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY_KEY_METADATA = 'idempotency:required';

/**
 * Idempotency Key가 필요한 엔드포인트에 적용하는 데코레이터
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export const RequireIdempotencyKey = (ttl: number = 300) =>
  SetMetadata(IDEMPOTENCY_KEY_METADATA, { required: true, ttl });
