import { Module } from '@nestjs/common';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { ReservationsService } from './reservations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisLockModule } from '../redis-lock';

@Module({
  imports: [PrismaModule, RedisLockModule],
  controllers: [ConcertsController],
  providers: [ConcertsService, ReservationsService],
  exports: [ConcertsService, ReservationsService],
})
export class ConcertsModule {}
