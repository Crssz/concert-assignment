import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisLockService } from './redis-lock.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class RedisLockModule {}
