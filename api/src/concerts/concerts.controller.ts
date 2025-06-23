import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConcertsService } from './concerts.service';
import { ReservationsService } from './reservations.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Request } from 'express';

@Controller('concerts')
@UseGuards(JwtAuthGuard)
export class ConcertsController {
  constructor(
    private readonly concertsService: ConcertsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createConcert(@Req() req: Request, @Body() dto: CreateConcertDto) {
    const userId = req.user!.id;
    return this.concertsService.createConcert(userId, dto);
  }

  @Get()
  async getAllConcerts(@Query() paginationDto: PaginationDto) {
    return this.concertsService.getAllConcerts(paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-concerts')
  async getMyCreatedConcerts(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user!.id;
    return this.concertsService.getUserConcerts(userId, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reservations')
  async getMyReservations(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user!.id;
    return this.reservationsService.getUserReservations(userId, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getReservationHistory(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user!.id;
    return this.reservationsService.getReservationHistory(
      undefined,
      userId,
      paginationDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('owner-history')
  async getOwnerReservationHistory(
    @Req() req: Request,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user!.id;
    return this.reservationsService.getOwnerReservationHistory(
      userId,
      paginationDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getConcertById(@Param('id') concertId: string) {
    return this.concertsService.getConcertById(concertId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  async getConcertReservationHistory(
    @Param('id') concertId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.reservationsService.getReservationHistory(
      concertId,
      undefined,
      paginationDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reserve')
  async reserveSeat(@Param('id') concertId: string, @Req() req: Request) {
    const userId = req.user!.id;
    return this.reservationsService.reserveSeat(concertId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/reserve')
  async cancelReservation(@Param('id') concertId: string, @Req() req: Request) {
    const userId = req.user!.id;
    await this.reservationsService.cancelReservation(concertId, userId);
    return { message: 'Reservation cancelled successfully' };
  }
}
