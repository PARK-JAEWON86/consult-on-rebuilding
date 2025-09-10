import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const time = new Date().toISOString();
    const env = process.env.NODE_ENV;

    // DB ping
    let db: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = 'up';
    } catch (_) {
      db = 'down';
    }

    // Redis ping
    let redis: 'up' | 'down' = 'down';
    try {
      const pong = await this.redis.ping();
      redis = pong === 'PONG' ? 'up' : 'down';
    } catch (_) {
      redis = 'down';
    }

    const ok = db === 'up' && redis === 'up';

    return {
      success: true,
      data: { time, env, ok, db, redis },
    };
  }
}
