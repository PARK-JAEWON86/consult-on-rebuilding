import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IDEMPOTENCY_KEY_METADATA } from '../decorators/idempotency-key.decorator';

/**
 * Idempotency 인터셉터
 * - 헤더에서 Idempotency-Key를 읽어 Redis에 캐싱
 * - 동일한 키로 요청 시 이전 응답 반환
 * - 진행 중인 요청에 대해서는 409 Conflict 응답
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, { status: 'processing' | 'completed'; data?: any }>();

  constructor(private reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const metadata = this.reflector.get(IDEMPOTENCY_KEY_METADATA, context.getHandler());

    // Idempotency가 필요하지 않은 엔드포인트는 그냥 통과
    if (!metadata?.required) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    // Idempotency-Key가 없으면 에러
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required for this endpoint');
    }

    // 키 형식 검증 (UUID 또는 적절한 형식)
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 10) {
      throw new BadRequestException('Invalid Idempotency-Key format');
    }

    const cacheKey = `idempotency:${idempotencyKey}`;

    // 캐시 확인
    const cached = this.cache.get(cacheKey);

    if (cached) {
      if (cached.status === 'processing') {
        // 동일한 요청이 진행 중이면 409 Conflict
        throw new ConflictException('Request with this Idempotency-Key is already being processed');
      }

      if (cached.status === 'completed') {
        // 이미 완료된 요청이면 캐시된 응답 반환
        return of(cached.data);
      }
    }

    // 요청 처리 시작 표시
    this.cache.set(cacheKey, { status: 'processing' });

    return next.handle().pipe(
      tap({
        next: (data) => {
          // 요청 성공 시 결과 캐싱
          this.cache.set(cacheKey, { status: 'completed', data });

          // TTL 후 캐시 삭제 (기본 5분)
          const ttl = metadata.ttl || 300;
          setTimeout(() => {
            this.cache.delete(cacheKey);
          }, ttl * 1000);
        },
        error: () => {
          // 에러 발생 시 processing 상태 제거 (재시도 가능하도록)
          this.cache.delete(cacheKey);
        },
      })
    );
  }
}
