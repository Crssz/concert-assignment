import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisLockService } from '../redis-lock/redis-lock.service';
import { PaginationDto } from './dto/pagination.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationAction } from '../../generated/prisma/client';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prismaService: PrismaService;
  let redisLockService: RedisLockService;

  const mockUserId = 'user-123';
  const mockConcertId = 'concert-123';
  const mockSeatNumber = 1;

  const mockConcert = {
    id: mockConcertId,
    name: 'Test Concert',
    description: 'Test Description',
    totalSeats: 100,
    creatorId: 'creator-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { reservations: 10 },
  };

  const mockReservation = {
    id: 'reservation-123',
    concertId: mockConcertId,
    userId: mockUserId,
    seatNumber: mockSeatNumber,
    createdAt: new Date(),
    user: { email: 'test@example.com' },
  };

  const mockPaginationDto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  const mockPrismaService = {
    concert: {
      findUnique: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    reservationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedisLockService = {
    executeWithLock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisLockService,
          useValue: mockRedisLockService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisLockService = module.get<RedisLockService>(RedisLockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reserveSeat', () => {
    it('should successfully reserve the next available seat', async () => {
      mockRedisLockService.executeWithLock.mockImplementation(
        async (lockKey, callback) => {
          return await callback();
        },
      );

      mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);
      mockPrismaService.reservation.findMany.mockResolvedValue([]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          reservation: {
            create: jest.fn().mockResolvedValue(mockReservation),
          },
          reservationHistory: {
            create: jest.fn(),
          },
        };
        return await callback(txMock);
      });

      const result = await service.reserveSeat(mockConcertId, mockUserId);

      expect(redisLockService.executeWithLock).toHaveBeenCalledWith(
        `concert:${mockConcertId}:reservation`,
        expect.any(Function),
        5000,
      );

      expect(result).toEqual({
        id: mockReservation.id,
        userId: mockReservation.userId,
        userEmail: mockReservation.user.email,
        seatNumber: mockReservation.seatNumber,
        createdAt: mockReservation.createdAt,
      });
    });

    it('should throw NotFoundException when concert does not exist', async () => {
      mockRedisLockService.executeWithLock.mockImplementation(
        async (lockKey, callback) => {
          return await callback();
        },
      );

      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      await expect(
        service.reserveSeat(mockConcertId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user already has reservation', async () => {
      mockRedisLockService.executeWithLock.mockImplementation(
        async (lockKey, callback) => {
          return await callback();
        },
      );

      mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );

      await expect(
        service.reserveSeat(mockConcertId, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when concert is fully booked', async () => {
      mockRedisLockService.executeWithLock.mockImplementation(
        async (lockKey, callback) => {
          return await callback();
        },
      );

      const fullyBookedConcert = {
        ...mockConcert,
        _count: { reservations: 100 },
      };

      mockPrismaService.concert.findUnique.mockResolvedValue(
        fullyBookedConcert,
      );
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.reserveSeat(mockConcertId, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should assign the next available seat number correctly', async () => {
      mockRedisLockService.executeWithLock.mockImplementation(
        async (lockKey, callback) => {
          return await callback();
        },
      );

      mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      mockPrismaService.reservation.findMany.mockResolvedValue([
        { seatNumber: 1 },
        { seatNumber: 2 },
        { seatNumber: 4 },
      ]);

      const expectedReservation = {
        ...mockReservation,
        seatNumber: 3,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          reservation: {
            create: jest.fn().mockResolvedValue(expectedReservation),
          },
          reservationHistory: {
            create: jest.fn(),
          },
        };
        return await callback(txMock);
      });

      const result = await service.reserveSeat(mockConcertId, mockUserId);

      expect(result.seatNumber).toBe(3);
    });
  });

  describe('cancelReservation', () => {
    it('should successfully cancel a reservation', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          reservation: {
            delete: jest.fn(),
          },
          reservationHistory: {
            create: jest.fn(),
          },
        };
        return callback(txMock);
      });

      await service.cancelReservation(mockConcertId, mockUserId);

      expect(prismaService.reservation.findUnique).toHaveBeenCalledWith({
        where: {
          concertId_userId: {
            concertId: mockConcertId,
            userId: mockUserId,
          },
        },
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelReservation(mockConcertId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserReservations', () => {
    it('should return paginated user reservations', async () => {
      const mockReservations = [
        {
          ...mockReservation,
          concert: { name: 'Test Concert' },
        },
      ];

      mockPrismaService.reservation.findMany.mockResolvedValue(
        mockReservations,
      );
      mockPrismaService.reservation.count.mockResolvedValue(1);

      const result = await service.getUserReservations(
        mockUserId,
        mockPaginationDto,
      );

      expect(prismaService.reservation.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: {
          user: {
            select: { email: true },
          },
          concert: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.reservation.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      expect(result).toEqual({
        data: [
          {
            id: mockReservation.id,
            userId: mockReservation.userId,
            userEmail: mockReservation.user.email,
            seatNumber: mockReservation.seatNumber,
            createdAt: mockReservation.createdAt,
          },
        ],
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });
  });

  describe('getReservationHistory', () => {
    it('should return paginated reservation history for a concert', async () => {
      const mockHistory = [
        {
          id: 'history-123',
          concertId: mockConcertId,
          userId: mockUserId,
          seatNumber: mockSeatNumber,
          action: ReservationAction.RESERVED,
          createdAt: new Date(),
          user: { email: 'test@example.com' },
          concert: { name: 'Test Concert' },
        },
      ];

      mockPrismaService.reservationHistory.findMany.mockResolvedValue(
        mockHistory,
      );
      mockPrismaService.reservationHistory.count.mockResolvedValue(1);

      const result = await service.getReservationHistory(
        mockConcertId,
        undefined,
        mockPaginationDto,
      );

      expect(prismaService.reservationHistory.findMany).toHaveBeenCalledWith({
        where: { concertId: mockConcertId },
        include: {
          user: {
            select: { email: true },
          },
          concert: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.reservationHistory.count).toHaveBeenCalledWith({
        where: { concertId: mockConcertId },
      });

      expect(result).toEqual({
        data: [
          {
            id: mockHistory[0].id,
            concertId: mockHistory[0].concertId,
            concertName: mockHistory[0].concert.name,
            userId: mockHistory[0].userId,
            userEmail: mockHistory[0].user.email,
            seatNumber: mockHistory[0].seatNumber,
            action: mockHistory[0].action,
            createdAt: mockHistory[0].createdAt,
          },
        ],
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should return paginated reservation history for a user', async () => {
      const mockHistory = [
        {
          id: 'history-123',
          concertId: mockConcertId,
          userId: mockUserId,
          seatNumber: mockSeatNumber,
          action: ReservationAction.CANCELLED,
          createdAt: new Date(),
          user: { email: 'test@example.com' },
          concert: { name: 'Test Concert' },
        },
      ];

      mockPrismaService.reservationHistory.findMany.mockResolvedValue(
        mockHistory,
      );
      mockPrismaService.reservationHistory.count.mockResolvedValue(1);

      const result = await service.getReservationHistory(
        undefined,
        mockUserId,
        mockPaginationDto,
      );

      expect(prismaService.reservationHistory.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: {
          user: {
            select: { email: true },
          },
          concert: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.reservationHistory.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });
  });

  describe('getOwnerReservationHistory', () => {
    it('should return paginated reservation history for all concerts owned by a user', async () => {
      const mockOwnerId = 'owner-123';
      const mockHistory = [
        {
          id: 'history-123',
          concertId: mockConcertId,
          userId: mockUserId,
          seatNumber: mockSeatNumber,
          action: ReservationAction.RESERVED,
          createdAt: new Date(),
          user: { email: 'test@example.com' },
          concert: { name: 'Test Concert' },
        },
        {
          id: 'history-456',
          concertId: 'concert-456',
          userId: 'user-456',
          seatNumber: 2,
          action: ReservationAction.CANCELLED,
          createdAt: new Date(),
          user: { email: 'test2@example.com' },
          concert: { name: 'Another Concert' },
        },
      ];

      mockPrismaService.reservationHistory.findMany.mockResolvedValue(
        mockHistory,
      );
      mockPrismaService.reservationHistory.count.mockResolvedValue(2);

      const result = await service.getOwnerReservationHistory(
        mockOwnerId,
        mockPaginationDto,
      );

      expect(prismaService.reservationHistory.findMany).toHaveBeenCalledWith({
        where: {
          concert: {
            creatorId: mockOwnerId,
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
        skip: 0,
        take: 10,
      });

      expect(prismaService.reservationHistory.count).toHaveBeenCalledWith({
        where: {
          concert: {
            creatorId: mockOwnerId,
          },
        },
      });

      expect(result).toEqual({
        data: [
          {
            id: mockHistory[0].id,
            concertId: mockHistory[0].concertId,
            concertName: mockHistory[0].concert.name,
            userId: mockHistory[0].userId,
            userEmail: mockHistory[0].user.email,
            seatNumber: mockHistory[0].seatNumber,
            action: mockHistory[0].action,
            createdAt: mockHistory[0].createdAt,
          },
          {
            id: mockHistory[1].id,
            concertId: mockHistory[1].concertId,
            concertName: mockHistory[1].concert.name,
            userId: mockHistory[1].userId,
            userEmail: mockHistory[1].user.email,
            seatNumber: mockHistory[1].seatNumber,
            action: mockHistory[1].action,
            createdAt: mockHistory[1].createdAt,
          },
        ],
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });
  });
});
