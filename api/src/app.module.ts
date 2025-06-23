import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RedisLockModule } from './redis-lock';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConcertsModule } from './concerts/concerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'auth-limit',
        // 5 request per 10 seconds
        ttl: 10 * 1000,
        limit: 5,
      },
      {
        name: 'info-limit',
        // 30 requests per minute
        ttl: 60 * 1000,
        limit: 30,
      },
      {
        name: 'reservation-limit',
        // 10 requests per minute
        ttl: 60 * 1000,
        limit: 10,
      },
    ]),
    RedisLockModule,
    PrismaModule,
    AuthModule,
    ConcertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
