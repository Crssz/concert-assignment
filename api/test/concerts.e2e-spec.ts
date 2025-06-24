import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Concerts (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;
  let concertId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prismaService.reservationHistory.deleteMany();
    await prismaService.reservation.deleteMany();
    await prismaService.concert.deleteMany();
    await prismaService.user.deleteMany();

    // Register and login a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.reservationHistory.deleteMany();
    await prismaService.reservation.deleteMany();
    await prismaService.concert.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('/concerts (POST)', () => {
    it('should create a new concert', () => {
      return request(app.getHttpServer())
        .post('/concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Concert',
          description: 'A test concert',
          totalSeats: 100,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.name).toBe('Test Concert');
          expect(response.body.description).toBe('A test concert');
          expect(response.body.totalSeats).toBe(100);
          expect(response.body.availableSeats).toBe(100);
          expect(response.body.creatorId).toBe(userId);
          concertId = response.body.id;
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '',
          description: '',
          totalSeats: 0,
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/concerts')
        .send({
          name: 'Test Concert',
          description: 'A test concert',
          totalSeats: 100,
        })
        .expect(401);
    });
  });

  describe('/concerts (GET)', () => {
    it('should return paginated concerts', () => {
      return request(app.getHttpServer())
        .get('/concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.data[0]).toHaveProperty('id');
          expect(response.body.data[0]).toHaveProperty('name');
          expect(response.body.data[0]).toHaveProperty('availableSeats');
          expect(response.body.meta).toHaveProperty('currentPage');
          expect(response.body.meta).toHaveProperty('totalPages');
          expect(response.body.meta).toHaveProperty('totalItems');
        });
    });
  });

  describe('/concerts/my-concerts (GET)', () => {
    it('should return paginated concerts created by the user', () => {
      return request(app.getHttpServer())
        .get('/concerts/my-concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.data[0].creatorId).toBe(userId);
        });
    });
  });

  describe('/concerts/:id (GET)', () => {
    it('should return a specific concert', () => {
      return request(app.getHttpServer())
        .get(`/concerts/${concertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(concertId);
          expect(response.body).toHaveProperty('reservations');
          expect(Array.isArray(response.body.reservations)).toBe(true);
        });
    });

    it('should return 404 for non-existent concert', () => {
      return request(app.getHttpServer())
        .get('/concerts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/concerts/:id/reserve (POST)', () => {
    it('should reserve the next available seat automatically', () => {
      return request(app.getHttpServer())
        .post(`/concerts/${concertId}/reserve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.userId).toBe(userId);
          expect(response.body.seatNumber).toBe(1);
        });
    });

    it('should fail to reserve when user already has a reservation', () => {
      return request(app.getHttpServer())
        .post(`/concerts/${concertId}/reserve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(409);
    });

    it('should assign seat number 2 to a second user', async () => {
      // Register and login a second test user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'password123',
          firstName: 'Test2',
          lastName: 'User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test2@example.com',
          password: 'password123',
        });

      const secondUserToken = loginResponse.body.accessToken;

      return request(app.getHttpServer())
        .post(`/concerts/${concertId}/reserve`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({})
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.seatNumber).toBe(2);
        });
    });
  });

  describe('/concerts/my-reservations (GET)', () => {
    it('should return paginated user reservations', () => {
      return request(app.getHttpServer())
        .get('/concerts/my-reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.data[0].userId).toBe(userId);
        });
    });
  });

  describe('/concerts/history (GET)', () => {
    it('should return paginated user reservation history', () => {
      return request(app.getHttpServer())
        .get('/concerts/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.data[0]).toHaveProperty('action');
        });
    });
  });

  describe('/concerts/:id/history (GET)', () => {
    it('should return paginated concert reservation history', () => {
      return request(app.getHttpServer())
        .get(`/concerts/${concertId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
          expect(response.body.data[0].concertId).toBe(concertId);
        });
    });
  });

  describe('/concerts/:id/reserve (DELETE)', () => {
    it('should cancel a reservation', () => {
      return request(app.getHttpServer())
        .delete(`/concerts/${concertId}/reserve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.message).toBe(
            'Reservation cancelled successfully',
          );
        });
    });

    it('should fail to cancel non-existent reservation', () => {
      return request(app.getHttpServer())
        .delete(`/concerts/${concertId}/reserve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/concerts/admin/dashboard-stats (GET)', () => {
    it('should return admin dashboard statistics', () => {
      return request(app.getHttpServer())
        .get('/concerts/admin/dashboard-stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('totalSeats');
          expect(response.body).toHaveProperty('totalReservations');
          expect(response.body).toHaveProperty('totalCancelledReservations');
          expect(typeof response.body.totalSeats).toBe('number');
          expect(typeof response.body.totalReservations).toBe('number');
          expect(typeof response.body.totalCancelledReservations).toBe(
            'number',
          );
          expect(response.body.totalSeats).toBeGreaterThanOrEqual(0);
          expect(response.body.totalReservations).toBeGreaterThanOrEqual(0);
          expect(
            response.body.totalCancelledReservations,
          ).toBeGreaterThanOrEqual(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/concerts/admin/dashboard-stats')
        .expect(401);
    });
  });

  describe('/concerts/:id (DELETE)', () => {
    let deleteConcertId: string;

    beforeAll(async () => {
      // Create a concert specifically for deletion testing
      const response = await request(app.getHttpServer())
        .post('/concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Concert to Delete',
          description: 'This concert will be deleted',
          totalSeats: 50,
        });
      deleteConcertId = response.body.id;
    });

    it('should soft delete a concert', () => {
      return request(app.getHttpServer())
        .delete(`/concerts/${deleteConcertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.message).toBe('Concert deleted successfully');
        });
    });

    it('should not return deleted concert in getAllConcerts', () => {
      return request(app.getHttpServer())
        .get('/concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          const deletedConcert = response.body.data.find(
            (concert: any) => concert.id === deleteConcertId,
          );
          expect(deletedConcert).toBeUndefined();
        });
    });

    it('should not return deleted concert in getConcertById', () => {
      return request(app.getHttpServer())
        .get(`/concerts/${deleteConcertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not return deleted concert in getUserConcerts', () => {
      return request(app.getHttpServer())
        .get('/concerts/my-concerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          const deletedConcert = response.body.data.find(
            (concert: any) => concert.id === deleteConcertId,
          );
          expect(deletedConcert).toBeUndefined();
        });
    });

    it('should fail to delete non-existent concert', () => {
      return request(app.getHttpServer())
        .delete('/concerts/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to delete concert not owned by user', async () => {
      // Register and login a third test user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test3@example.com',
          password: 'password123',
          firstName: 'Test3',
          lastName: 'User',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test3@example.com',
          password: 'password123',
        });

      const thirdUserToken = loginResponse.body.accessToken;

      return request(app.getHttpServer())
        .delete(`/concerts/${concertId}`)
        .set('Authorization', `Bearer ${thirdUserToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/concerts/${concertId}`)
        .expect(401);
    });
  });
});
