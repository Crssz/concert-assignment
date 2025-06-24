import { Test, TestingModule } from '@nestjs/testing';
import { ConcertsService } from './concerts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NotFoundException } from '@nestjs/common';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';
  const mockConcertId = 'concert-123';

  const mockConcert = {
    id: mockConcertId,
    name: 'Test Concert',
    description: 'Test Description',
    totalSeats: 100,
    creatorId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPaginationDto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  const mockPrismaService = {
    concert: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
    },
    reservationHistory: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConcertsService>(ConcertsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConcert', () => {
    it('should create a new concert', async () => {
      const createConcertDto: CreateConcertDto = {
        name: 'Test Concert',
        description: 'Test Description',
        totalSeats: 100,
      };

      mockPrismaService.concert.create.mockResolvedValue(mockConcert);

      const result = await service.createConcert(mockUserId, createConcertDto);

      expect(prismaService.concert.create).toHaveBeenCalledWith({
        data: {
          name: createConcertDto.name,
          description: createConcertDto.description,
          totalSeats: createConcertDto.totalSeats,
          creator: {
            connect: {
              id: mockUserId,
            },
          },
        },
      });

      expect(result).toEqual({
        id: mockConcert.id,
        name: mockConcert.name,
        description: mockConcert.description,
        totalSeats: mockConcert.totalSeats,
        availableSeats: mockConcert.totalSeats,
        creatorId: mockConcert.creatorId,
        createdAt: mockConcert.createdAt,
        updatedAt: mockConcert.updatedAt,
      });
    });

    it('should handle creation with minimum required fields', async () => {
      const createConcertDto: CreateConcertDto = {
        name: 'Minimal Concert',
        description: '',
        totalSeats: 1,
      };

      const minimalConcert = {
        ...mockConcert,
        name: 'Minimal Concert',
        description: '',
        totalSeats: 1,
      };

      mockPrismaService.concert.create.mockResolvedValue(minimalConcert);

      const result = await service.createConcert(mockUserId, createConcertDto);

      expect(result.totalSeats).toBe(1);
      expect(result.availableSeats).toBe(1);
      expect(result.name).toBe('Minimal Concert');
    });
  });

  describe('getAllConcerts', () => {
    it('should return paginated concerts with available seats', async () => {
      const mockConcerts = [
        {
          ...mockConcert,
          _count: { reservations: 5 },
        },
      ];

      mockPrismaService.concert.findMany.mockResolvedValue(mockConcerts);
      mockPrismaService.concert.count.mockResolvedValue(1);

      const result = await service.getAllConcerts(mockPaginationDto);

      expect(prismaService.concert.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.concert.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });

      expect(result).toEqual({
        data: [
          {
            id: mockConcert.id,
            name: mockConcert.name,
            description: mockConcert.description,
            totalSeats: mockConcert.totalSeats,
            availableSeats: 95,
            creatorId: mockConcert.creatorId,
            createdAt: mockConcert.createdAt,
            updatedAt: mockConcert.updatedAt,
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

    it('should handle empty results', async () => {
      mockPrismaService.concert.findMany.mockResolvedValue([]);
      mockPrismaService.concert.count.mockResolvedValue(0);

      const result = await service.getAllConcerts(mockPaginationDto);

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should handle pagination with page 2', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 5 };

      mockPrismaService.concert.findMany.mockResolvedValue([]);
      mockPrismaService.concert.count.mockResolvedValue(15);

      const result = await service.getAllConcerts(paginationDto);

      expect(prismaService.concert.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 5, // (page 2 - 1) * limit 5
        take: 5,
      });

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.totalPages).toBe(3); // Math.ceil(15/5)
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
    });

    it('should handle default pagination when no params provided', async () => {
      mockPrismaService.concert.findMany.mockResolvedValue([]);
      mockPrismaService.concert.count.mockResolvedValue(0);

      const result = await service.getAllConcerts({});

      expect(prismaService.concert.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(10);
    });

    it('should exclude soft deleted concerts', async () => {
      mockPrismaService.concert.findMany.mockResolvedValue([]);
      mockPrismaService.concert.count.mockResolvedValue(0);

      await service.getAllConcerts(mockPaginationDto);

      expect(prismaService.concert.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.concert.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });
  });

  describe('getConcertById', () => {
    it('should return a concert with reservations', async () => {
      const mockConcertWithReservations = {
        ...mockConcert,
        _count: { reservations: 2 },
        reservations: [
          {
            id: 'res-1',
            concertId: mockConcertId,
            userId: 'user-1',
            seatNumber: 1,
            createdAt: new Date(),
            user: {
              email: 'user1@example.com',
              firstName: 'User1',
              lastName: 'Test',
            },
            concert: {
              id: mockConcertId,
              name: 'Test Concert',
            },
          },
          {
            id: 'res-2',
            concertId: mockConcertId,
            userId: 'user-2',
            seatNumber: 2,
            createdAt: new Date(),
            user: {
              email: 'user2@example.com',
              firstName: 'User2',
              lastName: 'Test',
            },
            concert: {
              id: mockConcertId,
              name: 'Test Concert',
            },
          },
        ],
      };

      mockPrismaService.concert.findUnique.mockResolvedValue(
        mockConcertWithReservations,
      );

      const result = await service.getConcertById(mockConcertId);

      expect(prismaService.concert.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockConcertId,
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
              concert: {
                select: { name: true, id: true },
              },
            },
          },
          _count: {
            select: { reservations: true },
          },
        },
      });

      expect(result).toEqual({
        id: mockConcert.id,
        name: mockConcert.name,
        description: mockConcert.description,
        totalSeats: mockConcert.totalSeats,
        availableSeats: 98,
        creatorId: mockConcert.creatorId,
        createdAt: mockConcert.createdAt,
        updatedAt: mockConcert.updatedAt,
        reservations: [
          {
            id: 'res-1',
            concertId: mockConcertId,
            concertName: 'Test Concert',
            userId: 'user-1',
            userEmail: 'user1@example.com',
            userFirstName: 'User1',
            userLastName: 'Test',
            seatNumber: 1,
            createdAt: mockConcertWithReservations.reservations[0].createdAt,
          },
          {
            id: 'res-2',
            concertId: mockConcertId,
            concertName: 'Test Concert',
            userId: 'user-2',
            userEmail: 'user2@example.com',
            userFirstName: 'User2',
            userLastName: 'Test',
            seatNumber: 2,
            createdAt: mockConcertWithReservations.reservations[1].createdAt,
          },
        ],
      });
    });

    it('should return concert with no reservations', async () => {
      const mockConcertWithoutReservations = {
        ...mockConcert,
        _count: { reservations: 0 },
        reservations: [],
      };

      mockPrismaService.concert.findUnique.mockResolvedValue(
        mockConcertWithoutReservations,
      );

      const result = await service.getConcertById(mockConcertId);

      expect(result.availableSeats).toBe(100);
      expect(result.reservations).toEqual([]);
    });

    it('should throw NotFoundException when concert does not exist', async () => {
      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      await expect(service.getConcertById(mockConcertId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when concert is soft deleted', async () => {
      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      await expect(service.getConcertById(mockConcertId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserConcerts', () => {
    it('should return paginated concerts created by a user', async () => {
      const mockConcerts = [
        {
          ...mockConcert,
          _count: { reservations: 3 },
        },
      ];

      mockPrismaService.concert.findMany.mockResolvedValue(mockConcerts);
      mockPrismaService.concert.count.mockResolvedValue(1);

      const result = await service.getUserConcerts(
        mockUserId,
        mockPaginationDto,
      );

      expect(prismaService.concert.findMany).toHaveBeenCalledWith({
        where: {
          creatorId: mockUserId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.concert.count).toHaveBeenCalledWith({
        where: {
          creatorId: mockUserId,
          deletedAt: null,
        },
      });

      expect(result).toEqual({
        data: [
          {
            id: mockConcert.id,
            name: mockConcert.name,
            description: mockConcert.description,
            totalSeats: mockConcert.totalSeats,
            availableSeats: 97,
            creatorId: mockConcert.creatorId,
            createdAt: mockConcert.createdAt,
            updatedAt: mockConcert.updatedAt,
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

    it('should handle empty user concerts list', async () => {
      mockPrismaService.concert.findMany.mockResolvedValue([]);
      mockPrismaService.concert.count.mockResolvedValue(0);

      const result = await service.getUserConcerts(
        mockUserId,
        mockPaginationDto,
      );

      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should handle pagination for user concerts', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 3 };

      mockPrismaService.concert.findMany.mockResolvedValue([]);
      mockPrismaService.concert.count.mockResolvedValue(8);

      const result = await service.getUserConcerts(mockUserId, paginationDto);

      expect(prismaService.concert.findMany).toHaveBeenCalledWith({
        where: {
          creatorId: mockUserId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 3, // (page 2 - 1) * limit 3
        take: 3,
      });

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.totalPages).toBe(3); // Math.ceil(8/3)
    });

    it('should only return concerts created by the specific user', async () => {
      await service.getUserConcerts(mockUserId, mockPaginationDto);

      expect(prismaService.concert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            creatorId: mockUserId,
            deletedAt: null,
          },
        }),
      );

      expect(prismaService.concert.count).toHaveBeenCalledWith({
        where: {
          creatorId: mockUserId,
          deletedAt: null,
        },
      });
    });
  });

  describe('getAdminDashboardStats', () => {
    it('should return admin dashboard statistics', async () => {
      const mockUserConcerts = [
        { totalSeats: 100 },
        { totalSeats: 200 },
        { totalSeats: 150 },
      ];
      const mockTotalReservations = 75;
      const mockTotalCancelledReservations = 15;

      mockPrismaService.$transaction.mockResolvedValue([
        mockUserConcerts,
        mockTotalReservations,
        mockTotalCancelledReservations,
      ]);

      const result = await service.getAdminDashboardStats(mockUserId);

      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        ]),
      );

      expect(result).toEqual({
        totalSeats: 450, // 100 + 200 + 150
        totalReservations: 75,
        totalCancelledReservations: 15,
      });
    });

    it('should return zero values when user has no concerts', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0, 0]);

      const result = await service.getAdminDashboardStats(mockUserId);

      expect(result).toEqual({
        totalSeats: 0,
        totalReservations: 0,
        totalCancelledReservations: 0,
      });
    });

    it('should handle database transaction correctly', async () => {
      const mockUserConcerts = [{ totalSeats: 50 }];
      const mockTotalReservations = 25;
      const mockTotalCancelledReservations = 5;

      mockPrismaService.$transaction.mockResolvedValue([
        mockUserConcerts,
        mockTotalReservations,
        mockTotalCancelledReservations,
      ]);

      const result = await service.getAdminDashboardStats(mockUserId);

      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(result.totalSeats).toBe(50);
      expect(result.totalReservations).toBe(25);
      expect(result.totalCancelledReservations).toBe(5);
    });

    it('should calculate total seats correctly for multiple concerts', async () => {
      const mockUserConcerts = [
        { totalSeats: 100 },
        { totalSeats: 250 },
        { totalSeats: 75 },
        { totalSeats: 120 },
      ];

      mockPrismaService.$transaction.mockResolvedValue([
        mockUserConcerts,
        200,
        10,
      ]);

      const result = await service.getAdminDashboardStats(mockUserId);

      expect(result.totalSeats).toBe(545); // 100 + 250 + 75 + 120
    });
  });

  describe('softDeleteConcert', () => {
    it('should soft delete a concert when user is the creator', async () => {
      mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
      mockPrismaService.concert.update.mockResolvedValue({
        ...mockConcert,
        deletedAt: new Date(),
      });

      await service.softDeleteConcert(mockConcertId, mockUserId);

      expect(prismaService.concert.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockConcertId,
          deletedAt: null,
        },
      });

      expect(prismaService.concert.update).toHaveBeenCalledWith({
        where: { id: mockConcertId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when concert does not exist', async () => {
      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      await expect(
        service.softDeleteConcert(mockConcertId, mockUserId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.concert.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not the creator', async () => {
      const differentUserId = 'different-user-123';
      mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);

      await expect(
        service.softDeleteConcert(mockConcertId, differentUserId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.concert.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when concert is already deleted', async () => {
      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      await expect(
        service.softDeleteConcert(mockConcertId, mockUserId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.concert.update).not.toHaveBeenCalled();
    });

    it('should verify concert ownership before deletion', async () => {
      const differentCreatorConcert = {
        ...mockConcert,
        creatorId: 'different-creator-id',
      };

      mockPrismaService.concert.findUnique.mockResolvedValue(
        differentCreatorConcert,
      );

      await expect(
        service.softDeleteConcert(mockConcertId, mockUserId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.concert.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockConcertId,
          deletedAt: null,
        },
      });
      expect(prismaService.concert.update).not.toHaveBeenCalled();
    });

    it('should check if concert exists and is not already deleted', async () => {
      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      await expect(
        service.softDeleteConcert(mockConcertId, mockUserId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.concert.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockConcertId,
          deletedAt: null,
        },
      });
    });

    it('should successfully soft delete with proper timestamp', async () => {
      const mockUpdatedConcert = {
        ...mockConcert,
        deletedAt: new Date(),
      };

      mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
      mockPrismaService.concert.update.mockResolvedValue(mockUpdatedConcert);

      await service.softDeleteConcert(mockConcertId, mockUserId);

      expect(prismaService.concert.update).toHaveBeenCalledWith({
        where: { id: mockConcertId },
        data: { deletedAt: expect.any(Date) },
      });

      // Verify the deletedAt timestamp is recent (within last minute)
      const updateCall = mockPrismaService.concert.update.mock.calls[0][0];
      const deletedAt = updateCall.data.deletedAt;
      const now = new Date();
      expect(deletedAt).toBeInstanceOf(Date);
      expect(Math.abs(now.getTime() - deletedAt.getTime())).toBeLessThan(60000); // within 1 minute
    });
  });

  describe('Private Methods', () => {
    describe('createPaginationMeta', () => {
      it('should create correct pagination metadata', () => {
        // Test the pagination logic through public methods
        mockPrismaService.concert.findMany.mockResolvedValue([]);
        mockPrismaService.concert.count.mockResolvedValue(25);

        return service.getAllConcerts({ page: 3, limit: 5 }).then((result) => {
          expect(result.meta).toEqual({
            currentPage: 3,
            totalPages: 5, // Math.ceil(25/5)
            totalItems: 25,
            itemsPerPage: 5,
            hasNextPage: true,
            hasPreviousPage: true,
          });
        });
      });

      it('should handle edge case when on last page', () => {
        mockPrismaService.concert.findMany.mockResolvedValue([]);
        mockPrismaService.concert.count.mockResolvedValue(10);

        return service.getAllConcerts({ page: 2, limit: 5 }).then((result) => {
          expect(result.meta).toEqual({
            currentPage: 2,
            totalPages: 2,
            totalItems: 10,
            itemsPerPage: 5,
            hasNextPage: false,
            hasPreviousPage: true,
          });
        });
      });

      it('should handle single page scenario', () => {
        mockPrismaService.concert.findMany.mockResolvedValue([]);
        mockPrismaService.concert.count.mockResolvedValue(3);

        return service.getAllConcerts({ page: 1, limit: 10 }).then((result) => {
          expect(result.meta).toEqual({
            currentPage: 1,
            totalPages: 1,
            totalItems: 3,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        });
      });
    });

    describe('toConcertResponse', () => {
      it('should correctly transform concert data with available seats calculation', async () => {
        const mockConcertWithCount = {
          ...mockConcert,
          _count: { reservations: 15 },
        };

        mockPrismaService.concert.findMany.mockResolvedValue([
          mockConcertWithCount,
        ]);
        mockPrismaService.concert.count.mockResolvedValue(1);

        const result = await service.getAllConcerts(mockPaginationDto);

        expect(result.data[0]).toEqual({
          id: mockConcert.id,
          name: mockConcert.name,
          description: mockConcert.description,
          totalSeats: mockConcert.totalSeats,
          availableSeats: 85, // 100 - 15
          creatorId: mockConcert.creatorId,
          createdAt: mockConcert.createdAt,
          updatedAt: mockConcert.updatedAt,
        });
      });
    });
  });
});
