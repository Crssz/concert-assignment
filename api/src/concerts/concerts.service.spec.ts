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
    },
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
        include: {
          _count: {
            select: { reservations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prismaService.concert.count).toHaveBeenCalled();

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
  });

  describe('getConcertById', () => {
    it('should return a concert with reservations', async () => {
      const mockConcertWithReservations = {
        ...mockConcert,
        _count: { reservations: 2 },
        reservations: [
          {
            id: 'res-1',
            userId: 'user-1',
            seatNumber: 1,
            createdAt: new Date(),
            user: { email: 'user1@example.com' },
          },
          {
            id: 'res-2',
            userId: 'user-2',
            seatNumber: 2,
            createdAt: new Date(),
            user: { email: 'user2@example.com' },
          },
        ],
      };

      mockPrismaService.concert.findUnique.mockResolvedValue(
        mockConcertWithReservations,
      );

      const result = await service.getConcertById(mockConcertId);

      expect(prismaService.concert.findUnique).toHaveBeenCalledWith({
        where: { id: mockConcertId },
        include: {
          reservations: {
            include: {
              user: {
                select: { email: true },
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
            userId: 'user-1',
            userEmail: 'user1@example.com',
            seatNumber: 1,
            createdAt: mockConcertWithReservations.reservations[0].createdAt,
          },
          {
            id: 'res-2',
            userId: 'user-2',
            userEmail: 'user2@example.com',
            seatNumber: 2,
            createdAt: mockConcertWithReservations.reservations[1].createdAt,
          },
        ],
      });
    });

    it('should throw NotFoundException when concert does not exist', async () => {
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
        where: { creatorId: mockUserId },
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
        where: { creatorId: mockUserId },
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
  });
});
