import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RedisLockModule } from './redis-lock';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConcertsModule } from './concerts/concerts.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        // 50 requests per minute
        ttl: 60 * 1000,
        limit: 50,
      },
    ]),
    RedisLockModule,
    PrismaModule,
    AuthModule,
    ConcertsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
