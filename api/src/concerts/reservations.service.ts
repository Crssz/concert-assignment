import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisLockService } from '../redis-lock/redis-lock.service';
import { PaginationDto } from './dto/pagination.dto';
import {
  ReservationResponse,
  PaginatedReservationResponse,
  PaginatedReservationHistoryResponse,
  PaginationMeta,
} from './interfaces/concert.interface';
import { ReservationAction } from '../../generated/prisma/client';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisLock: RedisLockService,
  ) {}

  async reserveSeat(
    concertId: string,
    userId: string,
  ): Promise<ReservationResponse> {
    const lockKey = `concert:${concertId}:reservation`;
    const lockTtl = 5000; // 5 seconds

    const result = await this.redisLock.executeWithLock(
      lockKey,
      async () => {
        // Check if concert exists and has enough seats
        const concert = await this.prisma.concert.findUnique({
          where: { id: concertId },
          include: {
            _count: {
              select: { reservations: true },
            },
          },
        });

        if (!concert) {
          throw new NotFoundException('Concert not found');
        }

        // Check if user already has a reservation for this concert
        const existingUserReservation =
          await this.prisma.reservation.findUnique({
            where: {
              concertId_userId: {
                concertId,
                userId,
              },
            },
          });

        if (existingUserReservation) {
          throw new ConflictException(
            'User already has a reservation for this concert',
          );
        }

        // Check if concert is fully booked
        if (concert._count.reservations >= concert.totalSeats) {
          throw new ConflictException('Concert is fully booked');
        }

        // Find the next available seat number
        const reservedSeats = await this.prisma.reservation.findMany({
          where: { concertId },
          select: { seatNumber: true },
          orderBy: { seatNumber: 'asc' },
        });

        const reservedSeatNumbers = new Set(
          reservedSeats.map((r) => r.seatNumber),
        );

        let nextAvailableSeat = 1;
        for (let i = 1; i <= concert.totalSeats; i++) {
          if (!reservedSeatNumbers.has(i)) {
            nextAvailableSeat = i;
            break;
          }
        }

        // Create reservation and history in a transaction
        const result = await this.prisma.$transaction(async (tx) => {
          const reservation = await tx.reservation.create({
            data: {
              concertId,
              userId,
              seatNumber: nextAvailableSeat,
            },
            include: {
              user: {
                select: { email: true },
              },
            },
          });

          await tx.reservationHistory.create({
            data: {
              concertId,
              userId,
              seatNumber: nextAvailableSeat,
              action: ReservationAction.RESERVED,
            },
          });

          return reservation;
        });

        return {
          id: result.id,
          userId: result.userId,
          userEmail: result.user.email,
          seatNumber: result.seatNumber,
          createdAt: result.createdAt,
        };
      },
      lockTtl,
    );

    if (!result) {
      throw new ConflictException('Could not acquire lock for reservation');
    }

    return result;
  }

  async cancelReservation(concertId: string, userId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        concertId_userId: {
          concertId,
          userId,
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Delete reservation and create history in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.delete({
        where: { id: reservation.id },
      });

      await tx.reservationHistory.create({
        data: {
          concertId,
          userId,
          seatNumber: reservation.seatNumber,
          action: ReservationAction.CANCELLED,
        },
      });
    });
  }

  async getUserReservations(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedReservationResponse> {
    const page = Number(paginationDto.page ?? 1);
    const limit = Number(paginationDto.limit ?? 10);
    const skip = (page - 1) * limit;

    const [reservations, totalCount] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { userId },
        include: {
          user: {
            select: { email: true },
          },
          concert: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reservation.count({
        where: { userId },
      }),
    ]);

    const data = reservations.map((reservation) => ({
      id: reservation.id,
      userId: reservation.userId,
      userEmail: reservation.user.email,
      seatNumber: reservation.seatNumber,
      createdAt: reservation.createdAt,
    }));

    return {
      data,
      meta: this.createPaginationMeta(totalCount, page, limit),
    };
  }

  async getReservationHistory(
    concertId?: string,
    userId?: string,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedReservationHistoryResponse> {
    const page = Number(paginationDto?.page ?? 1);
    const limit = Number(paginationDto?.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: {
      concertId?: string;
      userId?: string;
    } = {};
    if (concertId) where.concertId = concertId;
    if (userId) where.userId = userId;

    const [history, totalCount] = await Promise.all([
      this.prisma.reservationHistory.findMany({
        where,
        include: {
          user: {
            select: { email: true },
          },
          concert: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reservationHistory.count({
        where,
      }),
    ]);

    const data = history.map((entry) => ({
      id: entry.id,
      concertId: entry.concertId,
      concertName: entry.concert.name,
      userId: entry.userId,
      userEmail: entry.user.email,
      seatNumber: entry.seatNumber,
      action: entry.action as 'RESERVED' | 'CANCELLED',
      createdAt: entry.createdAt,
    }));

    return {
      data,
      meta: this.createPaginationMeta(totalCount, page, limit),
    };
  }

  async getOwnerReservationHistory(
    ownerId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedReservationHistoryResponse> {
    const page = Number(paginationDto.page ?? 1);
    const limit = Number(paginationDto.limit ?? 10);
    const skip = (page - 1) * limit;

    const [history, totalCount] = await Promise.all([
      this.prisma.reservationHistory.findMany({
        where: {
          concert: {
            creatorId: ownerId,
          },
        },
        include: {
          user: {
            select: { email: true },
          },
          concert: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reservationHistory.count({
        where: {
          concert: {
            creatorId: ownerId,
          },
        },
      }),
    ]);

    const data = history.map((entry) => ({
      id: entry.id,
      concertId: entry.concertId,
      concertName: entry.concert.name,
      userId: entry.userId,
      userEmail: entry.user.email,
      seatNumber: entry.seatNumber,
      action: entry.action as 'RESERVED' | 'CANCELLED',
      createdAt: entry.createdAt,
    }));

    return {
      data,
      meta: this.createPaginationMeta(totalCount, page, limit),
    };
  }

  private createPaginationMeta(
    totalItems: number,
    currentPage: number,
    itemsPerPage: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }
}
