import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url, { lazyConnect: true });
  }

  async ping(): Promise<string> {
    if (!this.client.status || this.client.status === 'end') {
      await this.client.connect();
    }
    return this.client.ping();
  }

  async onModuleDestroy() {
    if (this.client && this.client.status !== 'end') {
      await this.client.quit();
    }
  }

  // Refresh token whitelist management
  async setRefreshToken(jti: string, userId: number, ttlSec: number): Promise<void> {
    await this.client.setex(`refresh:${jti}`, ttlSec, userId.toString());
  }

  async getRefreshToken(jti: string): Promise<number | null> {
    const userId = await this.client.get(`refresh:${jti}`);
    return userId ? parseInt(userId, 10) : null;
  }

  async deleteRefreshToken(jti: string): Promise<void> {
    await this.client.del(`refresh:${jti}`);
  }

  // Generic Redis operations
  async get(key: string): Promise<string | null> {
    if (!this.client.status || this.client.status === 'end') {
      await this.client.connect();
    }
    return this.client.get(key);
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    if (!this.client.status || this.client.status === 'end') {
      await this.client.connect();
    }
    await this.client.setex(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client.status || this.client.status === 'end') {
      await this.client.connect();
    }
    await this.client.del(key);
  }
}
