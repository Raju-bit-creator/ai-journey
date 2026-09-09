import { Controller, Get, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  async check() {
    const [postgres, redis] = await Promise.all([
      this.dataSource
        .query('SELECT 1')
        .then(() => 'up' as const)
        .catch(() => 'down' as const),
      this.redis
        .ping()
        .then(() => 'up' as const)
        .catch(() => 'down' as const),
    ]);

    return { postgres, redis };
  }
}
