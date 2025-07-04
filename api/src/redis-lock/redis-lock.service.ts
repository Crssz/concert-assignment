import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService extends Redis implements OnModuleDestroy {
  private readonly defaultTtl = 30000; // 30 seconds
  private readonly defaultRetryDelay = 50; // 50ms
  private readonly defaultRetryCount = 100; // 100 retries
  private readonly logger = new Logger(RedisLockService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: Number(configService.get<string>('REDIS_PORT', '6379')),
      username: configService.get<string>('REDIS_USERNAME', 'default'),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: Number(configService.get<string>('REDIS_DB', '0')),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.on('ready', () => {
      this.logger.log('Redis is ready');
    });
  }

  async acquireLock(key: string, ttl?: number): Promise<string | null> {
    const lockId = this.generateLockId();
    const lockKey = this.getLockKey(key);
    const ttlMs = ttl || this.defaultTtl;
    const result = await this.set(lockKey, lockId, 'PX', ttlMs, 'NX');
    return result === 'OK' ? lockId : null;
  }

  async acquireLockWithRetry(
    key: string,
    ttl?: number,
    retryCount?: number,
    retryDelay?: number,
  ): Promise<string | null> {
    const maxRetries = retryCount || this.defaultRetryCount;
    const delay = retryDelay || this.defaultRetryDelay;
    for (let i = 0; i < maxRetries; i++) {
      const lockId = await this.acquireLock(key, ttl);
      if (lockId) {
        return lockId;
      }
      await this.sleep(delay);
    }
    return null;
  }

  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = this.getLockKey(key);
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = (await this.eval(script, 1, lockKey, lockId)) as number;
    return result === 1;
  }

  async extendLock(key: string, lockId: string, ttl: number): Promise<boolean> {
    const lockKey = this.getLockKey(key);
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    const result = (await this.eval(script, 1, lockKey, lockId, ttl)) as number;
    return result === 1;
  }

  async isLocked(key: string): Promise<boolean> {
    const lockKey = this.getLockKey(key);
    const result = await this.exists(lockKey);
    return result === 1;
  }

  async executeWithLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T | null> {
    const lockId = await this.acquireLockWithRetry(key, ttl);
    if (!lockId) {
      return null;
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(key, lockId);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }

  private getLockKey(key: string): string {
    return `lock:${key}`;
  }

  private generateLockId(): string {
    return `${Date.now()}:${Math.random().toString(36).substring(2, 15)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
