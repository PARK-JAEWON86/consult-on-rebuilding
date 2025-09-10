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
}
