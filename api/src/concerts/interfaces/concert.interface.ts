export interface ConcertResponse {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConcertDetailResponse extends ConcertResponse {
  reservations: ReservationResponse[];
}

export interface ReservationResponse {
  id: string;
  userId: string;
  userEmail: string;
  seatNumber: number;
  createdAt: Date;
}

export interface ReservationHistoryResponse {
  id: string;
  concertId: string;
  concertName: string;
  userId: string;
  userEmail: string;
  seatNumber: number;
  action: 'RESERVED' | 'CANCELLED';
  createdAt: Date;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export type PaginatedConcertResponse = PaginatedResponse<ConcertResponse>;
export type PaginatedReservationResponse =
  PaginatedResponse<ReservationResponse>;
export type PaginatedReservationHistoryResponse =
  PaginatedResponse<ReservationHistoryResponse>;
