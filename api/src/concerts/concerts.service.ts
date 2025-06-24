import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { PaginationDto } from './dto/pagination.dto';
import {
  AdminDashboardStats,
  ConcertDetailResponse,
  ConcertResponse,
  PaginatedConcertResponse,
  PaginationMeta,
} from './interfaces/concert.interface';

@Injectable()
export class ConcertsService {
  constructor(private readonly prisma: PrismaService) {}

  async createConcert(
    userId: string,
    dto: CreateConcertDto,
  ): Promise<ConcertResponse> {
    const concert = await this.prisma.concert.create({
      data: {
        name: dto.name,
        description: dto.description,
        totalSeats: dto.totalSeats,
        creator: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return this.toConcertResponse(concert, dto.totalSeats);
  }

  async getAllConcerts(
    paginationDto: PaginationDto,
  ): Promise<PaginatedConcertResponse> {
    const page = Number(paginationDto.page ?? 1);
    const limit = Number(paginationDto.limit ?? 10);
    const skip = (page - 1) * limit;

    const [concerts, totalCount] = await Promise.all([
      this.prisma.concert.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.concert.count({ where: { deletedAt: null } }),
    ]);

    const data = concerts.map((concert) =>
      this.toConcertResponse(
        concert,
        concert.totalSeats - concert._count.reservations,
      ),
    );

    return {
      data,
      meta: this.createPaginationMeta(totalCount, page, limit),
    };
  }

  async getConcertById(concertId: string): Promise<ConcertDetailResponse> {
    const concert = await this.prisma.concert.findUnique({
      where: {
        id: concertId,
        deletedAt: null,
      },
      include: {
        reservations: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: { reservations: true },
        },
      },
    });

    if (!concert) {
      throw new NotFoundException('Concert not found');
    }

    const response: ConcertDetailResponse = {
      ...this.toConcertResponse(
        concert,
        concert.totalSeats - concert._count.reservations,
      ),
      reservations: concert.reservations.map((reservation) => ({
        id: reservation.id,
        userId: reservation.userId,
        userEmail: reservation.user.email,
        userFirstName: reservation.user.firstName,
        userLastName: reservation.user.lastName,
        seatNumber: reservation.seatNumber,
        createdAt: reservation.createdAt,
      })),
    };

    return response;
  }

  async getUserConcerts(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedConcertResponse> {
    const page = Number(paginationDto.page ?? 1);
    const limit = Number(paginationDto.limit ?? 10);
    const skip = (page - 1) * limit;

    const [concerts, totalCount] = await Promise.all([
      this.prisma.concert.findMany({
        where: {
          creatorId: userId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.concert.count({
        where: {
          creatorId: userId,
          deletedAt: null,
        },
      }),
    ]);

    const data = concerts.map((concert) =>
      this.toConcertResponse(
        concert,
        concert.totalSeats - concert._count.reservations,
      ),
    );

    return {
      data,
      meta: this.createPaginationMeta(totalCount, page, limit),
    };
  }

  async getAdminDashboardStats(userId: string): Promise<AdminDashboardStats> {
    const [userConcerts, totalReservations, totalCancelledReservations] =
      await this.prisma.$transaction([
        // Get all concerts created by the user
        this.prisma.concert.findMany({
          where: {
            creatorId: userId,
            deletedAt: null,
          },
          select: { totalSeats: true },
        }),
        // Get total reservations for user's concerts
        this.prisma.reservation.count({
          where: {
            concert: {
              creatorId: userId,
            },
          },
        }),
        // Get total cancelled reservations for user's concerts
        this.prisma.reservationHistory.count({
          where: {
            concert: {
              creatorId: userId,
            },
            action: 'CANCELLED',
          },
        }),
      ]);

    return {
      totalSeats: userConcerts.reduce(
        (sum, concert) => sum + concert.totalSeats,
        0,
      ),
      totalReservations: totalReservations,
      totalCancelledReservations: totalCancelledReservations,
    };
  }

  async softDeleteConcert(concertId: string, userId: string): Promise<void> {
    const concert = await this.prisma.concert.findUnique({
      where: {
        id: concertId,
        deletedAt: null,
      },
    });

    if (!concert) {
      throw new NotFoundException('Concert not found');
    }

    // Check if the user is the creator of the concert
    if (concert.creatorId !== userId) {
      throw new NotFoundException('Concert not found');
    }

    await this.prisma.concert.update({
      where: { id: concertId },
      data: { deletedAt: new Date() },
    });
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

  private toConcertResponse(
    concert: {
      id: string;
      name: string;
      description: string;
      totalSeats: number;
      creatorId: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt?: Date | null;
    },
    availableSeats: number,
  ): ConcertResponse {
    return {
      id: concert.id,
      name: concert.name,
      description: concert.description,
      totalSeats: concert.totalSeats,
      availableSeats,
      creatorId: concert.creatorId,
      createdAt: concert.createdAt,
      updatedAt: concert.updatedAt,
    };
  }
}
