import { Test, TestingModule } from '@nestjs/testing';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { ReservationsService } from './reservations.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { PaginationDto } from './dto/pagination.dto';
import type { Request } from 'express';

describe('ConcertsController', () => {
  let controller: ConcertsController;
  let concertsService: ConcertsService;
  let reservationsService: ReservationsService;

  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockRequest = { user: mockUser } as Request;

  const mockConcert = {
    id: 'concert-123',
    name: 'Test Concert',
    description: 'Test Description',
    totalSeats: 100,
    availableSeats: 95,
    creatorId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReservation = {
    id: 'reservation-123',
    userId: mockUser.id,
    userEmail: mockUser.email,
    seatNumber: 5,
    createdAt: new Date(),
  };

  const mockPaginationDto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  const mockPaginatedResponse = {
    data: [mockConcert],
    meta: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  const mockConcertsService = {
    createConcert: jest.fn(),
    getAllConcerts: jest.fn(),
    getConcertById: jest.fn(),
    getUserConcerts: jest.fn(),
  };

  const mockReservationsService = {
    reserveSeat: jest.fn(),
    cancelReservation: jest.fn(),
    getUserReservations: jest.fn(),
    getReservationHistory: jest.fn(),
    getOwnerReservationHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertsController],
      providers: [
        {
          provide: ConcertsService,
          useValue: mockConcertsService,
        },
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    controller = module.get<ConcertsController>(ConcertsController);
    concertsService = module.get<ConcertsService>(ConcertsService);
    reservationsService = module.get<ReservationsService>(ReservationsService);
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

      mockConcertsService.createConcert.mockResolvedValue(mockConcert);

      const result = await controller.createConcert(
        mockRequest,
        createConcertDto,
      );

      expect(concertsService.createConcert).toHaveBeenCalledWith(
        mockUser.id,
        createConcertDto,
      );
      expect(result).toEqual(mockConcert);
    });
  });

  describe('getAllConcerts', () => {
    it('should return paginated concerts', async () => {
      mockConcertsService.getAllConcerts.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.getAllConcerts(mockPaginationDto);

      expect(concertsService.getAllConcerts).toHaveBeenCalledWith(
        mockPaginationDto,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getMyCreatedConcerts', () => {
    it('should return paginated concerts created by the user', async () => {
      mockConcertsService.getUserConcerts.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.getMyCreatedConcerts(
        mockRequest,
        mockPaginationDto,
      );

      expect(concertsService.getUserConcerts).toHaveBeenCalledWith(
        mockUser.id,
        mockPaginationDto,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getMyReservations', () => {
    it('should return paginated user reservations', async () => {
      const mockReservationsPaginated = {
        data: [mockReservation],
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      mockReservationsService.getUserReservations.mockResolvedValue(
        mockReservationsPaginated,
      );

      const result = await controller.getMyReservations(
        mockRequest,
        mockPaginationDto,
      );

      expect(reservationsService.getUserReservations).toHaveBeenCalledWith(
        mockUser.id,
        mockPaginationDto,
      );
      expect(result).toEqual(mockReservationsPaginated);
    });
  });

  describe('getReservationHistory', () => {
    it('should return paginated user reservation history', async () => {
      const mockHistory = {
        data: [
          {
            id: 'history-123',
            concertId: 'concert-123',
            concertName: 'Test Concert',
            userId: mockUser.id,
            userEmail: mockUser.email,
            seatNumber: 5,
            action: 'RESERVED' as const,
            createdAt: new Date(),
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
      };
      mockReservationsService.getReservationHistory.mockResolvedValue(
        mockHistory,
      );

      const result = await controller.getReservationHistory(
        mockRequest,
        mockPaginationDto,
      );

      expect(reservationsService.getReservationHistory).toHaveBeenCalledWith(
        undefined,
        mockUser.id,
        mockPaginationDto,
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getOwnerReservationHistory', () => {
    it('should return paginated reservation history for all concerts owned by the user', async () => {
      const mockOwnerHistory = {
        data: [
          {
            id: 'history-123',
            concertId: 'concert-123',
            concertName: 'Test Concert',
            userId: 'user-456',
            userEmail: 'user456@example.com',
            seatNumber: 5,
            action: 'RESERVED' as const,
            createdAt: new Date(),
          },
          {
            id: 'history-456',
            concertId: 'concert-456',
            concertName: 'Another Concert',
            userId: 'user-789',
            userEmail: 'user789@example.com',
            seatNumber: 3,
            action: 'CANCELLED' as const,
            createdAt: new Date(),
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
      };
      mockReservationsService.getOwnerReservationHistory.mockResolvedValue(
        mockOwnerHistory,
      );

      const result = await controller.getOwnerReservationHistory(
        mockRequest,
        mockPaginationDto,
      );

      expect(reservationsService.getOwnerReservationHistory).toHaveBeenCalledWith(
        mockUser.id,
        mockPaginationDto,
      );
      expect(result).toEqual(mockOwnerHistory);
    });
  });

  describe('getConcertById', () => {
    it('should return a concert by id', async () => {
      const concertId = 'concert-123';
      const mockConcertDetail = {
        ...mockConcert,
        reservations: [mockReservation],
      };
      mockConcertsService.getConcertById.mockResolvedValue(mockConcertDetail);

      const result = await controller.getConcertById(concertId);

      expect(concertsService.getConcertById).toHaveBeenCalledWith(concertId);
      expect(result).toEqual(mockConcertDetail);
    });
  });

  describe('getConcertReservationHistory', () => {
    it('should return paginated concert reservation history', async () => {
      const concertId = 'concert-123';
      const mockHistory = {
        data: [
          {
            id: 'history-123',
            concertId,
            concertName: 'Test Concert',
            userId: mockUser.id,
            userEmail: mockUser.email,
            seatNumber: 5,
            action: 'RESERVED' as const,
            createdAt: new Date(),
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
      };
      mockReservationsService.getReservationHistory.mockResolvedValue(
        mockHistory,
      );

      const result = await controller.getConcertReservationHistory(
        concertId,
        mockPaginationDto,
      );

      expect(reservationsService.getReservationHistory).toHaveBeenCalledWith(
        concertId,
        undefined,
        mockPaginationDto,
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('reserveSeat', () => {
    it('should reserve the next available seat automatically', async () => {
      const concertId = 'concert-123';
      mockReservationsService.reserveSeat.mockResolvedValue(mockReservation);

      const result = await controller.reserveSeat(concertId, mockRequest);

      expect(reservationsService.reserveSeat).toHaveBeenCalledWith(
        concertId,
        mockUser.id,
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation', async () => {
      const concertId = 'concert-123';
      mockReservationsService.cancelReservation.mockResolvedValue(undefined);

      const result = await controller.cancelReservation(concertId, mockRequest);

      expect(reservationsService.cancelReservation).toHaveBeenCalledWith(
        concertId,
        mockUser.id,
      );
      expect(result).toEqual({ message: 'Reservation cancelled successfully' });
    });
  });
});
